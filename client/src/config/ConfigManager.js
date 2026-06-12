// Singleton config manager — loads env-derived defaults for API, features, UI, pricing, and business settings.
class ConfigManager {
  static #instance = null;
  #config = {};
  #overrides = {};

  constructor() {
    if (ConfigManager.#instance) {
      return ConfigManager.#instance;
    }
    ConfigManager.#instance = this;
    this.#initialize();
  }

  static getInstance() {
    if (!ConfigManager.#instance) {
      ConfigManager.#instance = new ConfigManager();
    }
    return ConfigManager.#instance;
  }

  #initialize() {
    this.#config = {
      api: {
        baseUrl: import.meta.env.VITE_BACKEND_URL || "",
        timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
        retryAttempts: parseInt(import.meta.env.VITE_RETRY_ATTEMPTS) || 3,
        retryDelay: parseInt(import.meta.env.VITE_RETRY_DELAY) || 5000,
      },
      app: {
        name: import.meta.env.VITE_APP_NAME || "SmartStayX",
        version: import.meta.env.VITE_APP_VERSION || "1.0.0",
        environment: import.meta.env.MODE || "development",
      },
      features: {
        enableChat: import.meta.env.VITE_ENABLE_CHAT !== "false",
        enableReviews: import.meta.env.VITE_ENABLE_REVIEWS !== "false",
        enableTestimonials: import.meta.env.VITE_ENABLE_TESTIMONIALS !== "false",
        enablePayment: import.meta.env.VITE_ENABLE_PAYMENT !== "false",
      },
      ui: {
        defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE || "en",
        defaultCurrency: import.meta.env.VITE_DEFAULT_CURRENCY || "USD",
        pageSize: parseInt(import.meta.env.VITE_PAGE_SIZE) || 10,
        maxImageSize: parseInt(import.meta.env.VITE_MAX_IMAGE_SIZE) || 5242880,
      },
      pricing: {
        weekendSurcharge: import.meta.env.VITE_WEEKEND_SURCHARGE || "0.15",
        highOccupancyThreshold: import.meta.env.VITE_HIGH_OCCUPANCY_THRESHOLD || "0.8",
        highOccupancySurcharge: import.meta.env.VITE_HIGH_OCCUPANCY_SURCHARGE || "0.10",
        bookingHoldMinutes: import.meta.env.VITE_BOOKING_HOLD_MINUTES || "15",
      },
      business: {
        defaultCountry: import.meta.env.VITE_DEFAULT_COUNTRY || "Sri Lanka",
        platformEmail: import.meta.env.VITE_PLATFORM_EMAIL || "admin@smartstayx.com",
        ownerOverrideEmail: import.meta.env.VITE_OWNER_OVERRIDE_EMAIL || "mbmafrij@gmail.com",
        supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || "support@smartstayx.com",
      },
    };
  }

  get(key, defaultValue = null) {
    const keys = key.split(".");
    let value = this.#config;
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    return this.#overrides[key] !== undefined ? this.#overrides[key] : value;
  }

  getApi(key) {
    return this.get(`api.${key}`);
  }

  getFeature(key) {
    return this.get(`features.${key}`, false);
  }

  override(key, value) {
    this.#overrides[key] = value;
  }

  resetOverrides() {
    this.#overrides = {};
  }

  getAll() {
    return JSON.parse(JSON.stringify(this.#config));
  }

  isProduction() {
    return this.get("app.environment") === "production";
  }

  isDevelopment() {
    return this.get("app.environment") === "development";
  }
}

export const config = ConfigManager.getInstance();
export default ConfigManager;
