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

    var st = document.createElement('style');
    st.id = 'odhpay-skin';
    st.innerHTML = [
      /* ============ ODH Pay dark skin for CCAvenue checkout ============
         HARD RULES (learned the hard way):
         1. NEVER set 'display' on their elements. Each payment row holds TWO
            spans (active + inactive) and their own CSS hides one; forcing
            display duplicates every row.
         2. '.primary-button-bg' is NOT only buttons — the countdown bar and the
            bank shortcuts use it too. Style real buttons by tag/id instead.
         3. '.ACTI' / '.NBBL-N' are <option> elements in the bank <select>,
            not list rows.
         CSS only; no DOM reads/writes beyond this <style> node.          ==== */

      ':root{color-scheme:dark;',
      '--bg:#0A0A0B;--surf:#141518;--surf2:#1B1D21;--line:#26282D;',
      '--txt:#FFFFFF;--muted:#9AA1AD;--faint:#6B7280;}',

      'html,body{background:var(--bg)!important;color:var(--txt)!important;',
      'font-family:-apple-system,"Segoe UI",Roboto,"Helvetica Neue",sans-serif!important;',
      'font-size:15px!important;line-height:1.5!important;-webkit-font-smoothing:antialiased;}',
      '*{box-shadow:none!important;text-shadow:none!important;}',

      'div,section,table,td,th,tr,form,ul,li,p,label,fieldset{',
      'background-color:transparent!important;border-color:var(--line)!important;}',
      '.content-bg,.innerpanel-bg,.billingPage{background-color:var(--surf)!important;}',
      '.content-text,.innerpanel-text,.formText{color:var(--muted)!important;}',
      '.highlight,.highlight-text,.orderTotal{color:var(--txt)!important;}',
      '.border{border:1px solid var(--line)!important;}',
      '.divider{border-color:var(--line)!important;opacity:.5;}',
      '.radius4,.radius6{border-radius:16px!important;}',

      /* merchant banner — our own header already carries the context */
      '#logo,.header-bg.banner{display:none!important;}',

      /* ---- countdown pill (must beat .primary-button-bg, hence the id) ---- */
      'div.transaction-time{background:var(--surf2)!important;color:var(--muted)!important;',
      'border:1px solid var(--line)!important;border-radius:999px!important;',
      'font-size:12px!important;font-weight:400!important;padding:7px 15px!important;',
      'margin:16px auto 6px!important;width:-webkit-fit-content!important;width:fit-content!important;}',
      'div.transaction-time strong,#whenCountdown{color:var(--txt)!important;',
      'font-weight:600!important;font-variant-numeric:tabular-nums;}',

      /* ---- order id + language ---- */
      '#orderinfo{background:transparent!important;border:0!important;padding:4px 18px 12px!important;}',
      '#mobileno{color:var(--faint)!important;font-size:11px!important;letter-spacing:.4px;',
      'font-variant-numeric:tabular-nums;}',

      /* ---- totals ---- */
      '#ordertotal,#orderAmt,#grandtotal,#amount{background:var(--surf)!important;}',
      '#grandtotal{border-top:1px solid var(--line)!important;margin-top:10px!important;padding-top:14px!important;}',
      '#grandtotal .innerpanel-text{color:var(--txt)!important;font-weight:600!important;}',
      '#finalTotal{color:var(--txt)!important;font-size:21px!important;font-weight:700!important;',
      'font-variant-numeric:tabular-nums;letter-spacing:-.4px;}',

      /* ---- section heading ---- */
      '#sectionheading,.payInfoDiv{background:transparent!important;border:0!important;',
      'padding:22px 18px 10px!important;}',
      '.heading-text{color:var(--faint)!important;font-size:11.5px!important;font-weight:600!important;',
      'letter-spacing:1.1px!important;text-transform:uppercase;}',

      /* ---- payment rows: colour ONLY. No display, no layout. Their CSS
             decides which of the two spans is visible. ---- */
      'ul{list-style:none!important;margin:0 14px!important;padding:0!important;}',
      'li{margin:0 0 10px!important;}',
      'span.paymentOption{background:var(--surf)!important;color:var(--txt)!important;',
      'border:1px solid var(--line)!important;border-radius:16px!important;',
      'font-size:15.5px!important;font-weight:500!important;}',
      'span.right-arrow{padding:18px 46px 18px 20px!important;position:relative!important;}',
      'span.right-arrow:after{content:"";position:absolute;right:20px;top:50%;',
      'width:8px;height:8px;border-right:2px solid var(--faint);border-bottom:2px solid var(--faint);',
      'transform:translateY(-50%) rotate(-45deg);}',

      /* ---- selects and their options (the bank list lives here) ---- */
      'select{background:var(--surf2)!important;color:var(--txt)!important;',
      'border:1px solid var(--line)!important;border-radius:12px!important;',
      'padding:13px 14px!important;font-size:15px!important;}',
      'option,option.ACTI,option.NBBL-N{background:#1B1D21!important;color:#FFFFFF!important;',
      'border-radius:0!important;padding:0!important;}',

      /* ---- REAL buttons only: by tag/id, never by .primary-button-bg ---- */
      'input[type=submit],button,a.SubmitBillShip,a.primary-button,#makePaymentNbk,#continue-pay-btn{',
      'background:#FFFFFF!important;color:#0A0A0B!important;border:0!important;',
      'border-radius:14px!important;padding:16px 22px!important;font-weight:650!important;',
      'font-size:15.5px!important;display:inline-block;text-align:center;}',
      'input[type=submit],button{width:auto;}',
      'a.SubmitBillShip *,a.primary-button *,#makePaymentNbk *{color:#0A0A0B!important;}',
      'a:not(.SubmitBillShip):not(.primary-button){color:var(--txt)!important;}',

      /* ---- text inputs ---- */
      'input[type=text],input[type=tel],input[type=number],input[type=password],textarea{',
      'background:var(--surf2)!important;color:var(--txt)!important;',
      'border:1px solid var(--line)!important;border-radius:12px!important;',
      'padding:14px 15px!important;font-size:15.5px!important;}',
      'input::placeholder,textarea::placeholder{color:var(--faint)!important;}',
      'input:focus,select:focus,textarea:focus{outline:0!important;border-color:#5A5F68!important;}',

      /* ---- UPI waiting ---- */
      '.upi-waiting{background:var(--surf)!important;border-radius:16px!important;color:var(--txt)!important;}',

      /* ---- only the footer trust marks get a light chip; do NOT blanket-style
             every img or bank shortcuts turn into grey blocks ---- */
      'img[src*="verified"],img[src*="rupay"],img[src*="pci"],img[src*="mastercard"],img[src*="visa"],',
      'img[src*="safekey"]{background:#FFFFFF!important;border-radius:6px!important;',
      'padding:3px 5px!important;max-height:24px!important;width:auto!important;}',
      'img[src=""],img:not([src]){display:none!important;}',

      /* ---- layout polish -------------------------------------------------- */
      /* order id + language sat on top of each other; make it one tidy row */
      '#orderinfo{display:flex!important;align-items:center!important;',
      'justify-content:space-between!important;gap:12px!important;flex-wrap:nowrap!important;}',
      '#orderinfo>span{width:auto!important;float:none!important;margin:0!important;}',
      '#orderinfo .language{flex:0 0 auto!important;}',
      '#pagelanguageSelect,#orderinfo select{min-width:104px!important;padding:9px 12px!important;}',

      /* generous card rhythm */
      '.row-fluid{margin:0!important;}',
      '#ordertotal,#orderAmt{padding:16px 18px!important;border-radius:18px!important;',
      'border:1px solid var(--line)!important;margin:6px 14px 0!important;}',

      /* payment rows sit closer to a native list */
      'li{margin:0 0 12px!important;}',
      'span.right-arrow{padding:20px 48px 20px 20px!important;}',

      /* ---- bank shortcuts: their logos are CSS background images built for a
             LIGHT ground, so keep them light but make it look intentional —
             a white chip rather than a stray grey slab. ---- */
      'span.topNetBank.popularBanks{background-color:#FFFFFF!important;',
      'border:1px solid #D9DCE1!important;border-radius:14px!important;',
      'width:auto!important;display:block!important;margin:0 14px 10px!important;',
      'min-height:58px!important;background-position:56px center!important;',
      'background-size:auto 26px!important;background-repeat:no-repeat!important;}',
      'input.radio.topNetBank{margin:0 0 0 18px!important;width:20px!important;height:20px!important;',
      'accent-color:#0A0A0B!important;vertical-align:middle!important;}',

      /* "All Other Banks" select was clipping its label */
      '#netBankingBank,select.payoptselect{height:auto!important;min-height:52px!important;',
      'line-height:1.4!important;padding:15px 16px!important;border-radius:14px!important;',
      'margin:0 14px!important;width:calc(100% - 28px)!important;',
      '-webkit-appearance:none!important;appearance:none!important;',
      'background-image:linear-gradient(45deg,transparent 50%,#9AA1AD 50%),',
      'linear-gradient(135deg,#9AA1AD 50%,transparent 50%)!important;',
      'background-position:calc(100% - 22px) 24px,calc(100% - 16px) 24px!important;',
      'background-size:6px 6px,6px 6px!important;background-repeat:no-repeat!important;}',
      '.all-other-banks .content-text{padding:0 16px!important;display:block!important;',
      'margin:18px 0 8px!important;font-size:11.5px!important;letter-spacing:1px!important;',
      'text-transform:uppercase!important;color:var(--faint)!important;}',

      /* note / consent copy */
      '.content-text{padding-left:16px!important;padding-right:16px!important;}',

      /* stray broken-image placeholders CCAvenue ships with empty src */
      '#nbbl-bank-logo,img[src=""],img:not([src]),img[src$="icon-upi-app-not-found.jpg"]{',
      'display:none!important;}',
      '.error{color:#FF6B6B!important;}',
      '::-webkit-scrollbar{width:0;height:0;}'
    ].join('');
    document.head.appendChild(st);
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
          <X size={22} color={DARK.text} strokeWidth={1.75} />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerClose} />
      )}
    </View>
  );

  const renderBusy = (title, caption) => (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={DARK.text} />
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
    let iconColor = "#FBBF24";
    let iconBg = "rgba(245,158,11,0.14)";
    let title = "Payment is still processing";
    let body =
      "We haven't had final confirmation from the bank yet. If money was debited it will be added automatically — no need to pay again.";

    if (success) {
      Icon = CheckCircle2;
      iconColor = "#34D399";
      iconBg = "rgba(16,185,129,0.14)";
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
      iconColor = "#F87171";
      iconBg = "rgba(239,68,68,0.14)";
      title = error ? "Couldn't start payment" : "Payment failed";
      body =
        error ||
        result?.failure_message ||
        "The payment didn't go through. You haven't been charged.";
    } else if (aborted) {
      Icon = XCircle;
      iconColor = DARK.muted;
      iconBg = DARK.surfaceAlt;
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
              <Lock size={14} color={DARK.muted} strokeWidth={1.75} />
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
                  <ActivityIndicator size="large" color={DARK.text} />
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

// The embedded CCAvenue page is skinned dark (CCAV_RESTYLE_JS), so this screen's
// own chrome is dark too — otherwise the modal reads as two stacked apps.
const DARK = {
  bg: "#0A0A0B",
  surface: "#141518",
  surfaceAlt: "#1B1D21",
  line: "#26282D",
  text: "#FFFFFF",
  muted: "#9AA1AD",
  faint: "#6B7280",
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: DARK.bg },

  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    backgroundColor: DARK.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DARK.line,
  },
  headerTitle: { ...type.h3, color: DARK.text, flex: 1, letterSpacing: -0.3 },
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
    backgroundColor: DARK.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DARK.line,
  },
  secureText: { ...type.bodySm, ...tabularNums, color: DARK.muted, letterSpacing: 0.1 },

  webview: { flex: 1, backgroundColor: DARK.bg },
  webviewLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DARK.bg,
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xl,
  },
  busyTitle: { ...type.h3, color: DARK.text, marginTop: space.lg, textAlign: "center" },
  busyCaption: {
    ...type.body,
    color: DARK.muted,
    marginTop: space.sm,
    textAlign: "center",
  },
  amountPill: {
    marginTop: space.xl,
    paddingHorizontal: space.base,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: DARK.surfaceAlt,
    borderWidth: 1,
    borderColor: DARK.line,
  },
  amountPillText: { ...type.label, ...tabularNums, color: DARK.text },

  resultIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: {
    ...type.h2,
    color: DARK.text,
    marginTop: space.lg,
    textAlign: "center",
  },
  resultBody: {
    ...type.body,
    color: DARK.muted,
    marginTop: space.sm,
    textAlign: "center",
  },
  resultAmount: {
    ...type.display,
    ...tabularNums,
    color: "#34D399",
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
    backgroundColor: DARK.surfaceAlt,
  },
  refLabel: { ...type.caption, color: DARK.faint },
  refValue: { ...type.caption, ...tabularNums, color: DARK.muted },

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
    backgroundColor: DARK.text,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "ios" ? elevation.level1 : null),
  },
  primaryBtnText: { ...type.button, color: DARK.bg },
  secondaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: DARK.surfaceAlt,
    borderWidth: 1,
    borderColor: DARK.line,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { ...type.button, color: DARK.text },
});
