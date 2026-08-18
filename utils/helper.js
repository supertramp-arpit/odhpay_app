const formatDate = (isoString) => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = String(date.getFullYear()).slice(-2); // Get last 2 digits of year

    return `${day}/${month}/${year}`;
};


function correctPath(url) {
    return url.replace(/\\/g, '/');
}

// Strip everything but digits and keep the trailing 10 digits — handles
// "+91 99360 19580", "919936019580", "9936019580" etc. Returns "" for input
// shorter than 10 digits so callers can validate.
function normalizeIndianMobile(value) {
    const digits = String(value ?? "").replace(/\D/g, "");
    return digits.length >= 10 ? digits.slice(-10) : "";
}

// ₹ with Indian digit grouping (₹1,23,456.00). Engine-safe: no reliance on
// Hermes Intl. Pass { decimals: 0 } for whole-rupee display.
function formatINR(value, { decimals = 2 } = {}) {
    const n = Number(value ?? 0);
    const safe = Number.isFinite(n) ? n : 0;
    const sign = safe < 0 ? '-' : '';
    const [intPart, fracPart] = Math.abs(safe).toFixed(decimals).split('.');
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3);
    const grouped = rest
        ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`
        : last3;
    return `₹${sign}${grouped}${decimals > 0 ? `.${fracPart}` : ''}`;
}

// BBPS/BillAvenue money fields are ALL in paise — bill_amount, and the minAmount
// / maxAmount on every entry in paymentChannels. Divide by 100 for display.
// Airtel DTH, for example, reports minAmount 25000 / maxAmount 14999900, i.e.
// ₹250 and ₹1,49,999 — not ₹25,000 and ₹1.5 crore.
// Guard null/undefined/"" explicitly: Number(null) and Number("") are both 0,
// which is finite — so a biller that publishes no maxAmount would otherwise come
// back as a ₹0 ceiling and reject every payment.
function paiseToRupees(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n / 100 : null;
}

// Limits for the channel we actually pay on.
//
// BillAvenue publishes a separate min/max per initChannel (ATM, AGT, BNKBRNCH,
// INT, MOB, POS…) and they differ — Airtel DTH caps ATM at ₹14,999 but MOB at
// ₹1,49,999. The bbps microservice sends <initChannel>MOB</initChannel>, so MOB
// is the row that governs our payments. Taking paymentChannels[0] (ATM) capped
// users ten times too low.
//
// Returns rupees, or null for a limit the biller doesn't publish.
function channelLimits(paymentChannels = []) {
    const list = Array.isArray(paymentChannels) ? paymentChannels : [];
    const byName = (name) =>
        list.find(
            (c) => String(c?.paymentChannelName || '').toUpperCase() === name
        );
    const channel = byName('MOB') || byName('INT') || list[0] || null;

    return {
        minAmount: channel ? paiseToRupees(channel.minAmount) : null,
        maxAmount: channel ? paiseToRupees(channel.maxAmount) : null,
        channelName: channel?.paymentChannelName || null,
    };
}

// Biller logos are served from the asset CDN keyed by biller id. Only ~1.2k of
// the 22k billers have one, so callers must handle the 404 (see BillerLogo).
// blr_image on the biller record is null for effectively every biller — use the
// biller id, never that field.
function billerLogoUri(billerId) {
    return billerId
        ? `https://assetcdn.odhpay.com/biller-assets/${billerId}.png?v=2`
        : null;
}

export {
    formatDate,
    correctPath,
    normalizeIndianMobile,
    formatINR,
    paiseToRupees,
    channelLimits,
    billerLogoUri,
};
