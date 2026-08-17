// components/Wallet/CCAvenueCheckout.js
//
// CCAvenue add-money checkout.
//
// The WebView is never the source of truth. It only tells us the flow ENDED; the
// outcome always comes from GET /payments/ccavenue/status/{order_id}, which the
// backend has verified against the encrypted gateway response. This is deliberate:
// the CCAvenue Android sample scrapes the result page's HTML for the words
// "Success"/"Failure", which is trivially spoofable.
//
// Backend: odhpaybackend/app/api/ccavenue.py
// Design:  .claude/skills/odhpay-ui-ux/references/design-system.md

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {
  CheckCircle2,
  Clock,
  Lock,
  X,
  XCircle,
} from "lucide-react-native";

import { color, elevation, hitSlop8, radius, space, tabularNums, type } from "../../theme/tokens";
import { formatINR } from "../../utils/helper";
import { ensureDeviceVerified, signedPost } from "../../utils/secureRequest";

const BASE_URL = "https://newapi.odhpay.com";
const CCAV = `${BASE_URL}/api/v1/payments/ccavenue`;

// The terminal marker our backend redirects to. Matching on the path (not on page
// text) is what keeps this un-spoofable.
const DONE_PATH = "/api/v1/payments/ccavenue/done";

// Status polling. The gateway's response can land a moment after the browser
// returns, so we keep asking rather than trusting the first answer.
const POLL_DELAYS_MS = [600, 900, 1200, 1500, 2000, 2000, 3000, 3000, 4000, 4000, 5000, 5000];

// ---------------------------------------------------------------------------
// Cosmetic restyle of CCAvenue's hosted checkout so it doesn't read as a jump
// out of the app.
//
// DELIBERATE CONSTRAINTS — read before editing:
//   * CSS ONLY. We never read, write or reorder DOM nodes, never touch inputs,
//     form values or hidden fields. A selector that stops matching simply has no
//     effect; it cannot break the payment.
//   * Domain-guarded. It applies only on *.ccavenue.com, so it never follows the
//     customer onto a bank/3-D Secure page.
//   * Idempotent and wrapped in try/catch — an error here must never surface to
//     someone mid-payment.
//   * Nothing is hidden that a customer or regulator needs: amount, order id,
//     timeout, card-network marks and the privacy-policy link all remain.
//
// This page belongs to CCAvenue and is inside their PCI-DSS scope. Their markup
// can change without notice, in which case this silently stops applying and the
// page falls back to its own styling. Branding it properly is a M.A.R.S
// dashboard setting; this is only a visual smoothing on top.
// ---------------------------------------------------------------------------
const CCAV_RESTYLE_JS = `
(function () {
  try {
    if (!/(^|\\.)ccavenue\\.com$/i.test(location.hostname)) return;
    if (document.getElementById('odhpay-skin')) return;

    var css = document.createElement('style');
    css.id = 'odhpay-skin';
    css.innerHTML = [
      ':root{--odh-ink:#0A0A0B;--odh-bg:#F7F8FA;--odh-surface:#FFFFFF;',
      '--odh-line:#E4E7EC;--odh-muted:#6B7280;}',

      'html,body{background:var(--odh-bg)!important;color:var(--odh-ink)!important;',
      '-webkit-font-smoothing:antialiased;font-family:-apple-system,Roboto,"Segoe UI",sans-serif!important;}',

      /* Panels and cards */
      'table,fieldset,.panel,.box,.container,.content{background:var(--odh-surface)!important;',
      'border-color:var(--odh-line)!important;}',

      /* Kill the loud default blues/greens for a monochrome look */
      'a{color:var(--odh-ink)!important;text-decoration:underline;}',
      'h1,h2,h3,h4,legend,label,td,th,p,span,div{color:inherit;}',

      /* The timeout banner: keep it visible, tone it down */
      '[class*="timer"],[id*="timer"],[class*="timeout"],[id*="timeout"]{',
      'background:#EEF0F3!important;color:var(--odh-ink)!important;border:0!important;}',

      /* Payment-option rows -> app-like list items */
      'li,.payOpt,[class*="payment"] li,[id*="payOpt"]{border-color:var(--odh-line)!important;}',
      'li:hover{background:#F4F5F7!important;}',

      /* Primary actions -> ink buttons */
      'input[type=submit],button,.btn,.button{background:var(--odh-ink)!important;',
      'color:#fff!important;border:0!important;border-radius:12px!important;',
      'padding:12px 18px!important;font-weight:600!important;box-shadow:none!important;}',

      /* Inputs */
      'input[type=text],input[type=tel],input[type=number],input[type=password],select{',
      'border:1px solid var(--odh-line)!important;border-radius:10px!important;',
      'padding:10px 12px!important;background:#fff!important;color:var(--odh-ink)!important;}',

      /* Their broken asset placeholders */
      'img[src=""],img:not([src]){display:none!important;}',

      /* Tighter rhythm on small screens */
      'body{font-size:15px!important;line-height:1.5!important;}'
    ].join('');
    document.head.appendChild(css);
  } catch (e) {
    /* styling must never break the payment page */
  }
})();
true;
`;

const PHASE = {
  CREATING: "creating",
  PAYING: "paying",
  VERIFYING: "verifying",
  RESULT: "result",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Auto-submitting form. JSON.stringify quotes the attribute AND escapes the
 *  payload, so the hex enc_request can never break out of the HTML. */
const buildFormHTML = (transactionUrl, accessCode, encRequest) => `<!doctype html>
<html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/></head>
<body style="margin:0;background:#F7F8FA">
  <form id="ccav" method="POST" action=${JSON.stringify(transactionUrl)}>
    <input type="hidden" name="access_code"  value=${JSON.stringify(accessCode)} />
    <input type="hidden" name="encRequest"   value=${JSON.stringify(encRequest)} />
  </form>
  <script>document.getElementById('ccav').submit();</script>
</body></html>`;

/**
 * @param {object}  props
 * @param {boolean} props.visible
 * @param {string|number} props.amount
 * @param {object}  [props.servicePayload]  When present this is a SERVICE payment
 *   (recharge / bill) charged straight to card / UPI / net banking — no wallet
 *   balance involved. Shape mirrors the backend's CreateServiceOrderRequest:
 *   { service_type, purpose?, recharge_data?, bbps_data?, service_metadata? }.
 *   When absent it is a wallet top-up.
 */
export default function CCAvenueCheckout({ visible, amount, servicePayload, onClose, onResult }) {
  const [phase, setPhase] = useState(PHASE.CREATING);
  const [order, setOrder] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Guards against the WebView firing navigation events more than once.
  const handledRef = useRef(false);
  const mountedRef = useRef(true);

  const authHeaders = useCallback(async () => {
    const token = await AsyncStorage.getItem("access_token");
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  }, []);

  // ---------------------------------------------------------------- create
  const createOrder = useCallback(async () => {
    setPhase(PHASE.CREATING);
    setError(null);
    setResult(null);
    handledRef.current = false;
    // Declared outside the try so the catch block can read it — a `const` inside
    // the try is not in scope there.
    let integrityMessage = null;
    try {
      // Gate 1: attest the app + device. This is an OPTIMISATION, not the
      // decision — the server is the authority. A failure here is remembered but
      // does NOT abort, because the backend may still authorise the caller (e.g.
      // an allowlisted QA account on a non-Play build). Aborting client-side
      // would override a decision that isn't ours to make.
      const verified = await ensureDeviceVerified();
      if (!mountedRef.current) return;
      integrityMessage = verified.ok ? null : verified.message;

      // Gate 2: signed request (timestamp + single-use nonce + body HMAC).
      // Services go to /service-order (creates a Service_Request and dispatches
      // the recharge/bill after payment); top-ups go to /order (credits wallet).
      const { data } = servicePayload
        ? await signedPost("/api/v1/payments/ccavenue/service-order", {
            ...servicePayload,
            amount: String(amount),
          })
        : await signedPost("/api/v1/payments/ccavenue/order", {
            amount: String(amount),
            purpose: "wallet_topup",
          });
      if (!mountedRef.current) return;
      setOrder(data);
      setPhase(PHASE.PAYING);
    } catch (e) {
      if (!mountedRef.current) return;
      const detail = e?.response?.data?.detail;
      // If the server rejected on device verification, the integrity reason we
      // captured above is the useful explanation — the generic 403 text is not.
      const isDeviceRejection = detail?.error === "DEVICE_NOT_VERIFIED";
      const message = isDeviceRejection
        ? integrityMessage ||
          "This device couldn't be verified for payments. Please install ODH Pay from the Play Store."
        : typeof detail === "string"
          ? detail
          : detail?.message || "We couldn't start this payment. Please try again.";
      setError(message);
      setPhase(PHASE.RESULT);
    }
  }, [amount, servicePayload]);

  useEffect(() => {
    mountedRef.current = true;
    if (visible) createOrder();
    return () => {
      mountedRef.current = false;
    };
  }, [visible, createOrder]);

  // ---------------------------------------------------------------- verify
  const pollStatus = useCallback(
    async (orderId) => {
      setPhase(PHASE.VERIFYING);
      const headers = await authHeaders();

      for (let i = 0; i < POLL_DELAYS_MS.length; i += 1) {
        await sleep(POLL_DELAYS_MS[i]);
        if (!mountedRef.current) return;
        try {
          const { data } = await axios.get(`${CCAV}/status/${orderId}`, {
            headers,
            timeout: 15000,
          });
          if (!mountedRef.current) return;
          if (data?.is_final) {
            setResult(data);
            setPhase(PHASE.RESULT);
            onResult?.(data);
            return;
          }
        } catch {
          // Transient — keep polling. A network blip is not an outcome.
        }
      }

      // Ran out of attempts. This is NOT a failure: the payment may still settle.
      // Say so honestly rather than inventing a verdict.
      if (!mountedRef.current) return;
      setResult({ status: "AWAITING_VERIFICATION", credited: false, is_final: false });
      setPhase(PHASE.RESULT);
      onResult?.({ status: "AWAITING_VERIFICATION", credited: false });
    },
    [authHeaders, onResult]
  );

  const handleNavChange = useCallback(
    (nav) => {
      const url = nav?.url || "";
      if (!url || handledRef.current) return;
      if (url.includes(DONE_PATH)) {
        handledRef.current = true;
        pollStatus(order?.order_id);
      }
    },
    [order?.order_id, pollStatus]
  );

  // Dismissing mid-flow must still verify — the payment may have gone through.
  const dismiss = useCallback(() => {
    if (phase === PHASE.PAYING && order?.order_id && !handledRef.current) {
      handledRef.current = true;
      pollStatus(order.order_id);
      return;
    }
    onClose?.();
  }, [phase, order?.order_id, pollStatus, onClose]);

  useEffect(() => {
    if (!visible) return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      dismiss();
      return true;
    });
    return () => sub.remove();
  }, [visible, dismiss]);

  // ---------------------------------------------------------------- render
  const renderHeader = (title, canClose = true) => (
    <View style={styles.header}>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      {canClose ? (
        <TouchableOpacity
          onPress={dismiss}
          style={styles.headerClose}
          hitSlop={hitSlop8}
          accessibilityRole="button"
          accessibilityLabel="Close payment"
        >
          <X size={22} color={color.text} strokeWidth={1.75} />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerClose} />
      )}
    </View>
  );

  const renderBusy = (title, caption) => (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={color.ink900} />
      <Text style={styles.busyTitle}>{title}</Text>
      <Text style={styles.busyCaption}>{caption}</Text>
      <View style={styles.amountPill}>
        <Text style={styles.amountPillText}>{formatINR(amount)}</Text>
      </View>
    </View>
  );

  const renderResult = () => {
    const status = result?.status;
    const failed = !!error || status === "FAILED";
    const aborted = status === "ABORTED";
    const success = status === "SUCCESS";

    let Icon = Clock;
    let iconColor = color.warningFg;
    let iconBg = color.warningBg;
    let title = "Payment is still processing";
    let body =
      "We haven't had final confirmation from the bank yet. If money was debited it will be added automatically — no need to pay again.";

    if (success) {
      Icon = CheckCircle2;
      iconColor = color.successFg;
      iconBg = color.successBg;
      if (servicePayload) {
        title = "Payment successful";
        // The payment is confirmed; the recharge/bill is dispatched right after
        // and reports separately. Don't claim it's already delivered.
        body = "We're completing your order now. You'll get a confirmation shortly.";
      } else {
        title = "Money added";
        body = result?.wallet_balance
          ? `Your wallet balance is now ${formatINR(result.wallet_balance)}.`
          : "Your wallet has been updated.";
      }
    } else if (failed) {
      Icon = XCircle;
      iconColor = color.errorFg;
      iconBg = color.errorBg;
      title = error ? "Couldn't start payment" : "Payment failed";
      body =
        error ||
        result?.failure_message ||
        "The payment didn't go through. You haven't been charged.";
    } else if (aborted) {
      Icon = XCircle;
      iconColor = color.textSecondary;
      iconBg = color.surfaceMuted;
      title = "Payment cancelled";
      body = "You cancelled this payment. Nothing has been charged.";
    }

    return (
      <View style={styles.centered}>
        <View style={[styles.resultIcon, { backgroundColor: iconBg }]}>
          <Icon size={32} color={iconColor} strokeWidth={1.75} />
        </View>

        <Text style={styles.resultTitle}>{title}</Text>
        <Text style={styles.resultBody}>{body}</Text>

        {success ? (
          <Text style={styles.resultAmount} accessibilityLabel={`Added ${formatINR(amount)}`}>
            {formatINR(result?.paid_amount ?? amount)}
          </Text>
        ) : null}

        {result?.bank_ref_no ? (
          <View style={styles.refRow}>
            <Text style={styles.refLabel}>Bank ref</Text>
            <Text style={styles.refValue}>{result.bank_ref_no}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {failed && !error ? (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={createOrder}
              accessibilityRole="button"
              accessibilityLabel="Try payment again"
            >
              <Text style={styles.secondaryBtnText}>Try again</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={styles.primaryBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={dismiss}
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        {phase === PHASE.CREATING ? (
          <>
            {renderHeader("Add money")}
            {renderBusy("Setting up payment", "Connecting securely to the payment gateway")}
          </>
        ) : null}

        {phase === PHASE.PAYING && order ? (
          <>
            {renderHeader("Secure payment")}
            <View style={styles.secureStrip}>
              <Lock size={14} color={color.textSecondary} strokeWidth={1.75} />
              <Text style={styles.secureText}>
                Paying {formatINR(amount)} via CCAvenue
              </Text>
            </View>
            <WebView
              style={styles.webview}
              originWhitelist={["https://*", "upi://*"]}
              source={{
                html: buildFormHTML(
                  order.transaction_url,
                  order.access_code,
                  order.enc_request
                ),
              }}
              onNavigationStateChange={handleNavChange}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              injectedJavaScript={CCAV_RESTYLE_JS}
              setSupportMultipleWindows={false}
              renderLoading={() => (
                <View style={styles.webviewLoader}>
                  <ActivityIndicator size="large" color={color.ink900} />
                </View>
              )}
              // UPI intent links must leave the WebView or the UPI app never opens.
              onShouldStartLoadWithRequest={(req) => {
                const url = req?.url ?? "";

                // Hand UPI deep links to Android rather than the WebView.
                // Returning false alone only BLOCKS the navigation — the URL must
                // also be opened, or the intent is silently swallowed and the
                // "Pay By Any UPI App" chooser never appears.
                //
                // Linking.openURL on a upi:// URI makes Android show the app
                // chooser listing every installed UPI app (GPay, PhonePe, Paytm,
                // BHIM…). The <queries> block in AndroidManifest.xml is what lets
                // Android 11+ actually see them.
                if (
                  url.startsWith("upi://") ||
                  url.startsWith("intent://") ||
                  url.startsWith("tez://") ||
                  url.startsWith("gpay://") ||
                  url.startsWith("phonepe://") ||
                  url.startsWith("paytmmp://") ||
                  url.startsWith("credpay://") ||
                  url.startsWith("bhim://") ||
                  url.startsWith("mobikwik://")
                ) {
                  Linking.openURL(url).catch(() => {
                    Alert.alert(
                      "No UPI app found",
                      "We couldn't open a UPI app on this device. Please install one, or choose another payment method."
                    );
                  });
                  return false; // stop the WebView; Android takes it from here
                }
                return true;
              }}
            />
          </>
        ) : null}

        {phase === PHASE.VERIFYING ? (
          <>
            {renderHeader("Confirming", false)}
            {renderBusy(
              "Confirming your payment",
              "Checking with your bank. Please don't close the app."
            )}
          </>
        ) : null}

        {phase === PHASE.RESULT ? (
          <>
            {renderHeader("Add money")}
            {renderResult()}
          </>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.background },

  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    backgroundColor: color.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  headerTitle: { ...type.h3, color: color.text, flex: 1 },
  headerClose: {
    width: 44,
    height: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  secureStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: color.surfaceMuted,
  },
  secureText: { ...type.bodySm, ...tabularNums, color: color.textSecondary },

  webview: { flex: 1, backgroundColor: color.background },
  webviewLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.background,
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xl,
  },
  busyTitle: { ...type.h3, color: color.text, marginTop: space.lg, textAlign: "center" },
  busyCaption: {
    ...type.body,
    color: color.textSecondary,
    marginTop: space.sm,
    textAlign: "center",
  },
  amountPill: {
    marginTop: space.xl,
    paddingHorizontal: space.base,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: color.surfaceMuted,
  },
  amountPillText: { ...type.label, ...tabularNums, color: color.text },

  resultIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: {
    ...type.h2,
    color: color.text,
    marginTop: space.lg,
    textAlign: "center",
  },
  resultBody: {
    ...type.body,
    color: color.textSecondary,
    marginTop: space.sm,
    textAlign: "center",
  },
  resultAmount: {
    ...type.display,
    ...tabularNums,
    color: color.moneyCredit,
    marginTop: space.lg,
  },

  refRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginTop: space.lg,
    paddingHorizontal: space.base,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
    backgroundColor: color.surfaceMuted,
  },
  refLabel: { ...type.caption, color: color.textTertiary },
  refValue: { ...type.caption, ...tabularNums, color: color.textSecondary },

  actions: {
    position: "absolute",
    left: space.xl,
    right: space.xl,
    bottom: space.xl,
    flexDirection: "row",
    gap: space.md,
  },
  primaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: color.ink900,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "ios" ? elevation.level1 : null),
  },
  primaryBtnText: { ...type.button, color: color.textInverse },
  secondaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { ...type.button, color: color.text },
});
