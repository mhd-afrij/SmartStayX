const bookingConfig = {
  get holdMinutes() {
    return parseInt(process.env.BOOKING_HOLD_MINUTES) || 15
  },
  get holdCleanupIntervalMinutes() {
    return parseInt(process.env.BOOKING_HOLD_CLEANUP_INTERVAL_MINUTES) || 1
  },
  get weekendSurcharge() {
    return parseFloat(process.env.BOOKING_WEEKEND_SURCHARGE) || 0.15
  },
  get highOccupancyThreshold() {
    return parseFloat(process.env.BOOKING_HIGH_OCCUPANCY_THRESHOLD) || 0.8
  },
  get highOccupancySurcharge() {
    return parseFloat(process.env.BOOKING_HIGH_OCCUPANCY_SURCHARGE) || 0.10
  },
  get lastMinuteWindowHours() {
    return parseInt(process.env.BOOKING_LAST_MINUTE_HOURS) || 48
  },
  get defaultCurrency() {
    return process.env.DEFAULT_CURRENCY || 'USD'
  },
  get defaultCountry() {
    return process.env.DEFAULT_COUNTRY || 'Sri Lanka'
  },
  get placeholderEmailDomain() {
    return process.env.PLACEHOLDER_EMAIL_DOMAIN || '@placeholder.local'
  },

  // ── Seasonal Pricing ──────────────────────────────────────────────
  get seasonalRules() {
    const raw = process.env.BOOKING_SEASONAL_RULES
    if (!raw) return defaultSeasonalRules
    try { return JSON.parse(raw) } catch { return defaultSeasonalRules }
  },
  get lengthOfStayDiscounts() {
    const raw = process.env.BOOKING_LOS_DISCOUNTS
    if (!raw) return defaultLosDiscounts
    try { return JSON.parse(raw) } catch { return defaultLosDiscounts }
  },
  get lastMinuteDiscount() {
    return parseFloat(process.env.BOOKING_LAST_MINUTE_DISCOUNT) || 0.15
  },
  get lockTimeoutMs() {
    return parseInt(process.env.BOOKING_LOCK_TIMEOUT_MS) || 10000
  },
  get lockRetryDelayMs() {
    return parseInt(process.env.BOOKING_LOCK_RETRY_DELAY_MS) || 200
  },
  get lockMaxRetries() {
    return parseInt(process.env.BOOKING_LOCK_MAX_RETRIES) || 15
  },
}

const defaultSeasonalRules = [
  { name: 'new-year',  start: '12-26', end: '01-05', multiplier: 1.4 },
  { name: 'summer',    start: '06-01', end: '08-31', multiplier: 1.2 },
  { name: 'christmas', start: '12-20', end: '12-27', multiplier: 1.5 },
]

const defaultLosDiscounts = [
  { minNights: 7,  discount: 0.10 },
  { minNights: 14, discount: 0.20 },
  { minNights: 21, discount: 0.30 },
]

export default bookingConfig
