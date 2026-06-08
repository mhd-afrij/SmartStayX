import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PRICING_CONFIG, FALLBACK_VALUES } from '../../constants/pricingConfig';

vi.mock('../../config/ConfigManager', () => {
  const overrides = {};
  const mockConfig = {
    get: vi.fn((key, defaultValue) => {
      if (key in overrides) return overrides[key];
      const defaults = {
        'pricing.weekendSurcharge': '0.15',
        'pricing.highOccupancyThreshold': '0.8',
        'pricing.highOccupancySurcharge': '0.10',
        'pricing.bookingHoldMinutes': '15',
      };
      return key in defaults ? defaults[key] : defaultValue;
    }),
    override: vi.fn((key, val) => { overrides[key] = val; }),
    resetOverrides: vi.fn(() => { Object.keys(overrides).forEach(k => delete overrides[k]); }),
  };
  return { config: mockConfig, default: class ConfigManager {} };
});

describe('PRICING_CONFIG', () => {
  it('weekendSurcharge defaults to 0.15', () => {
    expect(PRICING_CONFIG.weekendSurcharge).toBe(0.15);
  });

  it('highOccupancyThreshold defaults to 0.8', () => {
    expect(PRICING_CONFIG.highOccupancyThreshold).toBe(0.8);
  });

  it('highOccupancySurcharge defaults to 0.10', () => {
    expect(PRICING_CONFIG.highOccupancySurcharge).toBe(0.10);
  });

  it('bookingHoldMinutes defaults to 15', () => {
    expect(PRICING_CONFIG.bookingHoldMinutes).toBe(15);
  });

  it('returns parsed float values', async () => {
    const { config } = await import('../../config/ConfigManager');
    config.override('pricing.weekendSurcharge', '0.25');
    expect(PRICING_CONFIG.weekendSurcharge).toBe(0.25);
  });

  it('returns parsed int for bookingHoldMinutes', async () => {
    const { config } = await import('../../config/ConfigManager');
    config.override('pricing.bookingHoldMinutes', '30');
    expect(PRICING_CONFIG.bookingHoldMinutes).toBe(30);
  });

  it('falls back when config returns falsy', async () => {
    const { config } = await import('../../config/ConfigManager');
    config.override('pricing.weekendSurcharge', '');
    expect(PRICING_CONFIG.weekendSurcharge).toBe(0.15);
  });
});

describe('FALLBACK_VALUES', () => {
  it('provides expected fallback strings', () => {
    expect(FALLBACK_VALUES.HOTEL_NAME).toBe('Hotel');
    expect(FALLBACK_VALUES.ROOM_TYPE).toBe('Room');
    expect(FALLBACK_VALUES.ADDRESS).toBe('Address unavailable');
    expect(FALLBACK_VALUES.GUEST_NAME).toBe('Guest');
  });
});
