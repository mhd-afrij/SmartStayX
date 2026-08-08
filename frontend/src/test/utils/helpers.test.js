import { describe, it, expect } from 'vitest';

// Inline helpers extracted from RoomDetails and MyBookings to test in isolation
const calcNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut) - new Date(checkIn);
  return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
};

const formatPrice = (amount, currency = 'USD', rate = 1) => {
  const symbols = { USD: '$', GBP: 'GBP', EUR: '€', LKR: 'Rs', AED: 'AED', SGD: 'S$' };
  const converted = amount * rate;
  return `${symbols[currency] || '$'}${converted.toFixed(2)}`;
};

describe('calcNights', () => {
  it('returns 0 for missing dates', () => {
    expect(calcNights(null, null)).toBe(0);
    expect(calcNights('', '2025-06-10')).toBe(0);
  });

  it('returns 0 for past dates', () => {
    expect(calcNights(new Date(), new Date())).toBe(0);
  });

  it('calculates single night', () => {
    expect(calcNights('2025-06-10', '2025-06-11')).toBe(1);
  });

  it('calculates multiple nights', () => {
    expect(calcNights('2025-06-10', '2025-06-15')).toBe(5);
  });

  it('rounds up partial days', () => {
    const checkIn = new Date('2025-06-10T12:00:00');
    const checkOut = new Date('2025-06-11T06:00:00');
    expect(calcNights(checkIn, checkOut)).toBe(1);
  });
});

describe('formatPrice', () => {
  it('formats USD by default', () => {
    expect(formatPrice(100)).toBe('$100.00');
  });

  it('converts using rate', () => {
    expect(formatPrice(100, 'LKR', 300)).toBe('Rs30000.00');
  });

  it('handles zero', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });
});
