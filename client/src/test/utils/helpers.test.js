import { describe, it, expect } from 'vitest';

// Inline helpers extracted from RoomDetails and MyBookings to test in isolation
const calcNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut) - new Date(checkIn);
  return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
};

const getPricingBreakdown = (booking) => {
  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);
  const milliseconds = checkOut.getTime() - checkIn.getTime();
  const fallbackNights = Math.max(1, Math.ceil(milliseconds / (1000 * 3600 * 24)));
  const nights = booking.nights || fallbackNights;
  const basePerNight = booking.basePricePerNight ?? booking.room?.pricePerNight ?? 0;
  const dynamicPerNight = booking.dynamicPricePerNight ?? booking.totalPrice / nights;
  const multiplier = booking.priceMultiplier ?? (basePerNight > 0 ? dynamicPerNight / basePerNight : 1);
  const baseTotal = Number((basePerNight * nights).toFixed(2));
  const surgeAmount = Number((booking.totalPrice - baseTotal).toFixed(2));
  return { nights, basePerNight, dynamicPerNight, multiplier, surgeAmount };
};

const formatPrice = (amount, currency = 'USD', rate = 1) => {
  const symbols = { USD: '$', GBP: 'GBP', EUR: '€', LKR: 'Rs', AED: 'AED', SGD: 'S$' };
  const converted = amount * rate;
  return `${symbols[currency] || '$'}${converted.toFixed(2)}`;
};

const getCallouts = (pricing) => {
  if (!pricing) return [];
  const calls = [];
  const mult = pricing.priceMultiplier;
  if (mult > 1) {
    const pct = Math.round((mult - 1) * 100);
    if (pct > 0) calls.push({ type: 'surcharge', text: `${pct}% surcharge applied (weekend/seasonal)` });
  }
  if (pricing.basePricePerNight > pricing.dynamicPricePerNight) {
    const saved = pricing.basePricePerNight - pricing.dynamicPricePerNight;
    const pct = Math.round((saved / pricing.basePricePerNight) * 100);
    if (pct > 0) calls.push({ type: 'saving', text: `Save ${pct}% with long-stay / last-minute discount` });
  }
  return calls;
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

describe('getPricingBreakdown', () => {
  const baseBooking = {
    checkInDate: '2025-06-10',
    checkOutDate: '2025-06-15',
    totalPrice: 500,
    basePricePerNight: 100,
    dynamicPricePerNight: 100,
    priceMultiplier: 1,
  };

  it('calculates nights from dates', () => {
    const result = getPricingBreakdown(baseBooking);
    expect(result.nights).toBe(5);
  });

  it('uses booking.nights when provided', () => {
    const result = getPricingBreakdown({ ...baseBooking, nights: 3 });
    expect(result.nights).toBe(3);
  });

  it('computes surge amount correctly', () => {
    const result = getPricingBreakdown(baseBooking);
    expect(result.basePerNight).toBe(100);
    expect(result.surgeAmount).toBe(0);
  });

  it('detects surge pricing', () => {
    const result = getPricingBreakdown({
      ...baseBooking,
      totalPrice: 750,
      basePricePerNight: 100,
      dynamicPricePerNight: 150,
      priceMultiplier: 1.5,
    });
    expect(result.surgeAmount).toBe(250);
    expect(result.multiplier).toBe(1.5);
  });

  it('falls back to room pricePerNight', () => {
    const result = getPricingBreakdown({
      checkInDate: '2025-06-10',
      checkOutDate: '2025-06-11',
      totalPrice: 200,
      room: { pricePerNight: 200 },
    });
    expect(result.basePerNight).toBe(200);
  });

  it('handles zero base price gracefully', () => {
    const result = getPricingBreakdown({
      ...baseBooking,
      basePricePerNight: 0,
      totalPrice: 0,
    });
    expect(result.multiplier).toBe(1);
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

describe('getCallouts', () => {
  it('returns empty for no pricing', () => {
    expect(getCallouts(null)).toEqual([]);
  });

  it('detects surcharge when multiplier > 1', () => {
    const calls = getCallouts({
      priceMultiplier: 1.25,
      basePricePerNight: 100,
      dynamicPricePerNight: 125,
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].type).toBe('surcharge');
    expect(calls[0].text).toContain('25%');
  });

  it('detects saving when dynamic < base', () => {
    const calls = getCallouts({
      priceMultiplier: 0.8,
      basePricePerNight: 100,
      dynamicPricePerNight: 80,
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].type).toBe('saving');
    expect(calls[0].text).toContain('20%');
  });

  it('reports both surcharge and saving simultaneously', () => {
    const calls = getCallouts({
      priceMultiplier: 1.5,
      basePricePerNight: 200,
      dynamicPricePerNight: 100,
    });
    expect(calls).toHaveLength(2);
    expect(calls[0].type).toBe('surcharge');
    expect(calls[1].type).toBe('saving');
  });
});
