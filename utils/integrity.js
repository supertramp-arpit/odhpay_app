import { NativeModules } from "react-native";
import * as Crypto from "expo-crypto";
import { Buffer } from "buffer";


const { IntegrityModule } = NativeModules;

// Only replace + and /, keep padding '='
function toBase64WebSafe(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")   // + → -
    .replace(/\//g, "_");  // / → _
}

async function generateSecureNonce() {
  const bytes = await Crypto.getRandomBytesAsync(16);
  const nonce = toBase64WebSafe(Buffer.from(bytes));

  console.log("Nonce (web-safe):", nonce);
  return nonce;
}

export async function getIntegrityToken() {
  const nonce = await generateSecureNonce();
  const token = await IntegrityModule.getIntegrityToken(nonce);
  return { token, nonce };
}


// import { getIntegrityToken } from "../utils/integrity";

// async function secureLogin() {
//   const { token, nonce } = await getIntegrityToken();

//   await api.post("/security/verify-integrity", {
//     integrity_token: token,
//     nonce,
//   });

//   // Continue login only if backend returns OK
// }







// import { getIntegrityToken } from "../utils/integrity";
// import api from "../utils/api"; // your axios wrapper

// export async function secureLogin(phone, password) {
//   const { token, nonce } = await getIntegrityToken();

//   const res = await api.post("/security/verify-integrity", {
//     integrity_token: token,
//     nonce,
//     phone,
//     password
//   });

//   return res.data;
// }




// import { getIntegrityToken } from "../utils/integrity";
// import api from "../utils/api"; // axios instance

// export async function secureLogin(payload) {
//   const { token, nonce } = await getIntegrityToken();

//   const res = await api.post("/security/verify-integrity", {
//     integrity_token: token,
//     nonce,
//   });

//   if (!res.data.allowed) {
//     throw new Error("Device / app failed integrity: " + res.data.reason);
//   }

//   // proceed with normal login (OTP, password, etc.)
// }
