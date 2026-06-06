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

export { formatDate, correctPath, normalizeIndianMobile };
