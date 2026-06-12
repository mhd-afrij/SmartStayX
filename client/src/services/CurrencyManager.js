import { config } from "../config";

// Currency conversion and formatting — supports AED, SGD, USD, GBP, LKR with Intl formatting.
class CurrencyManager {
  static CURRENCY_OPTIONS = [
    { code: "AED", symbol: "AED", label: "Dirham (AED)", rate: 3.67 },
    { code: "SGD", symbol: "S$", label: "Singapore Dollar (SGD)", rate: 1.35 },
    { code: "USD", symbol: "$", label: "US Dollar (USD)", rate: 1 },
    { code: "GBP", symbol: "GBP", label: "Pound Sterling (GBP)", rate: 0.79 },
    { code: "LKR", symbol: "Rs", label: "Sri Lankan Rupee (LKR)", rate: 300 },
  ];

  #selectedCurrency;
  #selectedLanguage = "en";

  constructor(initialCurrency) {
    const configured = this.normalize(config.get("ui.defaultCurrency", "USD"));
    this.#selectedCurrency = this.normalize(initialCurrency || configured);
  }

  get selectedCurrency() {
    return this.#selectedCurrency;
  }

  get symbol() {
    const cfg = this.getCurrencyConfig(this.#selectedCurrency);
    return cfg?.symbol || "$";
  }

  get options() {
    return CurrencyManager.CURRENCY_OPTIONS;
  }

  setCurrency(code) {
    const normalized = this.normalize(code);
    if (this.getCurrencyConfig(normalized)) {
      this.#selectedCurrency = normalized;
    }
  }

  setLanguage(lang) {
    this.#selectedLanguage = lang;
  }

  getCurrencyConfig(code) {
    return CurrencyManager.CURRENCY_OPTIONS.find((c) => c.code === code);
  }

  normalize(value) {
    if (!value) return "USD";
    const upper = value.toUpperCase();
    if (upper === "AED") return "AED";
    if (upper === "SGD" || upper === "S$") return "SGD";
    if (value === "$" || upper === "USD") return "USD";
    if (upper === "GBP") return "GBP";
    if (upper === "LKR" || upper === "RS" || upper === "RS.") return "LKR";
    return "USD";
  }

  convert(amount) {
    const base = Number(amount || 0);
    const cfg = this.getCurrencyConfig(this.#selectedCurrency);
    return Number((base * (cfg?.rate || 1)).toFixed(2));
  }

  format(amount, options = {}) {
    const locale = this.#selectedLanguage === "en"
      ? "en-US"
      : `${this.#selectedLanguage}-${this.#selectedLanguage.toUpperCase()}`;
    const converted = this.convert(amount);
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: this.#selectedCurrency,
      maximumFractionDigits: options.maximumFractionDigits ?? 0,
      minimumFractionDigits: options.minimumFractionDigits ?? 0,
    }).format(converted);
  }
}

export default CurrencyManager;
