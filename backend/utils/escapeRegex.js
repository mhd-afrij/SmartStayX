// escapeRegex.js — Escape user input before using it in a `$regex`/RegExp to
// prevent ReDoS and injection through malicious search terms.
const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default escapeRegex;