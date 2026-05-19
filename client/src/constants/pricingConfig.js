import { config } from '../config/ConfigManager'

export const PRICING_CONFIG = {
  get weekendSurcharge() {
    return parseFloat(config.get('pricing.weekendSurcharge')) || 0.15
  },
  get highOccupancyThreshold() {
    return parseFloat(config.get('pricing.highOccupancyThreshold')) || 0.8
  },
  get highOccupancySurcharge() {
    return parseFloat(config.get('pricing.highOccupancySurcharge')) || 0.10
  },
  get bookingHoldMinutes() {
    return parseInt(config.get('pricing.bookingHoldMinutes')) || 15
  },
}

export const FALLBACK_VALUES = {
  HOTEL_NAME: 'Hotel',
  ROOM_TYPE: 'Room',
  ADDRESS: 'Address unavailable',
  GUEST_NAME: 'Guest',
}
