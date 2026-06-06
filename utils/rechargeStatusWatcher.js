// Watches a service request's status via two parallel channels — WebSocket
// push from the backend's /realtime/notifications endpoint, and a polling
// fallback against /api/v1/wallet/service-status/<ref>. Whichever observes a
// terminal ("completed" | "failed") state first wins; the other is cancelled.
//
// The WS path notifies within ~100ms of `process_bbps_task` finishing on the
// backend; the poll path covers the case where the upgrade was blocked or
// dropped mid-flight (corporate Wi-Fi, captive portals, etc.).
//
// Usage:
//   const stop = watchRechargeStatus({
//     referenceId,
//     token,
//     onUpdate: (snapshot) => { /* { status: 'pending'|'completed'|'failed', message, source } */ },
//   });
//   // ...later
//   stop();

import axios from "axios";

const STATUS_URL = (ref) =>
  `https://newapi.odhpay.com/api/v1/wallet/service-status/${ref}`;
const WS_URL = (token) =>
  `wss://newapi.odhpay.com/realtime/notifications?token=${encodeURIComponent(token)}`;

const TERMINAL = new Set(["completed", "failed"]);

export function watchRechargeStatus({ referenceId, token, onUpdate }) {
  let stopped = false;
  let ws = null;

  if (!referenceId) {
    onUpdate?.({ status: "pending", message: "Missing reference", source: "client" });
    return () => {};
  }

  const finish = (snapshot) => {
    if (stopped) return;
    stopped = true;
    try { ws && ws.close(); } catch {}
    onUpdate?.(snapshot);
  };

  const tentative = (snapshot) => {
    if (stopped) return;
    onUpdate?.(snapshot);
  };

  // ---- WebSocket path ----
  if (token) {
    try {
      ws = new WebSocket(WS_URL(token));
      ws.onmessage = (evt) => {
        if (stopped) return;
        let msg;
        try { msg = JSON.parse(evt.data); } catch { return; }
        const data = msg?.data || {};
        const ref = data.reference_id || data.referenceId;
        if (!ref || ref !== referenceId) return;
        const status = (msg?.status || "").toUpperCase();
        if (status !== "SUCCESS" && status !== "FAILED") return;
        finish({
          status: status === "SUCCESS" ? "completed" : "failed",
          message: data.message,
          source: "ws",
        });
      };
      ws.onerror = () => { /* harmless — poll loop continues */ };
    } catch (e) {
      // ignore — poll fallback handles it
    }
  }

  // ---- Polling fallback ----
  (async () => {
    const phases = [[500, 6], [1000, 25]]; // ~30s total budget
    const headers = token
      ? { Accept: "application/json", Authorization: `Bearer ${token}` }
      : { Accept: "application/json" };

    for (const [delay, count] of phases) {
      for (let i = 0; i < count; i++) {
        if (stopped) return;
        try {
          const { data } = await axios.get(STATUS_URL(referenceId), { headers });
          if (stopped) return;
          const svc = (data?.service_status || "").toLowerCase();
          if (TERMINAL.has(svc)) {
            finish({
              status: svc,
              message: data?.error_message || data?.message,
              source: "poll",
              raw: data,
            });
            return;
          }
          // Still pending — surface latest snapshot for the UI to show.
          tentative({
            status: "pending",
            message: data?.message,
            source: "poll",
            raw: data,
          });
        } catch (e) {
          // transient, keep going
        }
        if (stopped) return;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    // Budget exhausted without terminal — leave the screen on "pending".
    // The backend will eventually push via FCM; nothing more to do here.
  })();

  return () => {
    stopped = true;
    try { ws && ws.close(); } catch {}
  };
}
