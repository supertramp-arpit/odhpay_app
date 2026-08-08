// utils/secureRequest.js
//
// Two security helpers for money endpoints, both required by the backend once
// PLAY_INTEGRITY_ENFORCE / HMAC_ENFORCE are switched on:
//
//   ensureDeviceVerified() — obtains a Play Integrity token from the native
//     IntegrityModule and exchanges it at POST /security/verify-device, which
//     sets User.DeviceVerified. Endpoints guarded by authenticate_verified_device
//     return 403 DEVICE_NOT_VERIFIED until this has happened.
//
//   signedPost() — adds the HMAC headers the backend's require_signed_request
//     dependency checks.
//
// NOTE on the HMAC secret: it ships inside the APK and can be extracted by anyone
// willing to unpack it, so a valid signature does NOT prove the caller is the real
// app. It buys replay protection and body integrity. Play Integrity is the control
// that actually attests app+device — this layers on top of it, it does not replace it.

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { sha256 } from "js-sha256";
import axios from "axios";

import { getIntegrityToken } from "./integrity";

const BASE_URL = "https://newapi.odhpay.com";

// Must equal the backend's HMAC_API_SECRET. Inject at build time
// (EAS secret / app.config env) rather than committing a literal.
const HMAC_SECRET = process.env.EXPO_PUBLIC_HMAC_SECRET || "";
const HMAC_KEY_ID = process.env.EXPO_PUBLIC_HMAC_KEY_ID || "";

// DeviceVerified persists server-side, so re-verifying on every payment is waste.
// Re-verify at most this often; the backend's own freshness checks are stricter
// where it matters.
const VERIFY_TTL_MS = 30 * 60 * 1000;
const VERIFIED_AT_KEY = "device_verified_at";

async function authHeaders() {
  const token = await AsyncStorage.getItem("access_token");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

const toHex = (bytes) =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

/**
 * Ensure this device is Play-Integrity verified server-side.
 * Returns { ok: true } or { ok: false, reason, message } — never throws, so a
 * caller can decide how loudly to fail.
 */
export async function ensureDeviceVerified({ force = false } = {}) {
  try {
    if (!force) {
      const last = await AsyncStorage.getItem(VERIFIED_AT_KEY);
      if (last && Date.now() - Number(last) < VERIFY_TTL_MS) {
        return { ok: true, cached: true };
      }
    }

    // Native Play Integrity call (android/.../integrity/IntegrityModule.kt).
    const { token, nonce } = await getIntegrityToken();
    if (!token) {
      return {
        ok: false,
        reason: "NO_INTEGRITY_TOKEN",
        message: "Couldn't verify this device. Please make sure you installed ODH Pay from the Play Store.",
      };
    }

    const headers = await authHeaders();
    const { data } = await axios.post(
      `${BASE_URL}/security/verify-device`,
      { integrity_token: token, nonce },
      { headers, timeout: 20000 }
    );

    if (data?.allowed) {
      await AsyncStorage.setItem(VERIFIED_AT_KEY, String(Date.now()));
      return { ok: true };
    }
    return {
      ok: false,
      reason: data?.reason || "NOT_ALLOWED",
      message: describeIntegrityFailure(data?.reason),
    };
  } catch (e) {
    const detail = e?.response?.data?.detail;
    return {
      ok: false,
      reason: detail?.reason || detail?.error || "VERIFY_FAILED",
      message:
        describeIntegrityFailure(detail?.reason) ||
        "We couldn't verify this device. Please try again.",
    };
  }
}

/**
 * Per-request Play Integrity headers for endpoints guarded by the backend's
 * `require_fresh_integrity` dependency (wallet top-up / pay / pay-service /
 * transfer, investment, KYC, login OTP, v2 payments).
 *
 * Those endpoints return 422 MISSING_INTEGRITY_HEADERS once
 * PLAY_INTEGRITY_ENFORCE_FRESH is on, so any screen calling them must spread
 * these into its headers.
 *
 * Returns {} if a token can't be obtained — the backend decides whether that is
 * fatal. Never throws, so a transient Play Services hiccup can't crash a payment
 * screen before the server has had its say.
 */
export async function integrityHeaders() {
  try {
    const { token, nonce } = await getIntegrityToken();
    if (!token || !nonce) return {};
    return { "x-integrity-token": token, "x-integrity-nonce": nonce };
  } catch {
    return {};
  }
}

/** Turn a backend verdict into something a customer can act on. */
export function describeIntegrityFailure(reason) {
  switch (reason) {
    case "DEVICE_NOT_TRUSTED":
      return "This device didn't pass Google's security check. Payments are blocked on rooted or modified devices.";
    case "APP_NOT_RECOGNIZED":
      return "This build of ODH Pay isn't recognised by Google Play. Please install the app from the Play Store.";
    case "APP_NOT_LICENSED":
      return "This install isn't licensed to your Google account. Please reinstall from the Play Store.";
    case "TOKEN_TOO_OLD":
    case "NONCE_MISMATCH":
      return "The security check timed out. Please try again.";
    case "INTEGRITY_MISCONFIGURED":
      return "Payments are temporarily unavailable. Please try again shortly.";
    default:
      return null;
  }
}

/**
 * POST with HMAC signature headers.
 * Canonical string must match app/middleware/request_signing.py exactly:
 *   METHOD \n PATH \n SHA256(body) \n timestamp \n nonce
 */
export async function signedPost(path, body, { timeout = 20000 } = {}) {
  const headers = await authHeaders();
  const payload = JSON.stringify(body ?? {});

  if (HMAC_SECRET) {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonceBytes = await Crypto.getRandomBytesAsync(16);
    const nonce = toHex(nonceBytes); // 32 chars — backend requires >= 16

    // Real HMAC-SHA256 — NOT sha256(secret + message), which is a different
    // (and length-extension-weak) construction that would never match the
    // backend's hmac.new(...). js-sha256 is pure JS, so no native module needed.
    const bodyHash = sha256(payload);
    const canonical = ["POST", path, bodyHash, timestamp, nonce].join("\n");
    const signature = sha256.hmac(HMAC_SECRET, canonical);

    headers["X-ODH-Timestamp"] = timestamp;
    headers["X-ODH-Nonce"] = nonce;
    headers["X-ODH-Signature"] = signature;
    if (HMAC_KEY_ID) headers["X-ODH-Key"] = HMAC_KEY_ID;
  }

  return axios.post(`${BASE_URL}${path}`, payload, {
    headers,
    timeout,
    transformRequest: [(d) => d], // already a string; must not be re-serialised
  });
}
