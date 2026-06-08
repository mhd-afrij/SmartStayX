import { describe, it, expect } from 'vitest';
import {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  CANCELLABLE_STATUSES,
  PAYABLE_STATUSES,
  SERVICE_ELIGIBLE_STATUSES,
} from '../../constants/bookingStatuses';
import { FALLBACK_VALUES } from '../../constants/pricingConfig';

describe('bookingStatuses', () => {
  it('defines all booking statuses', () => {
    expect(BOOKING_STATUS.PENDING).toBe('pending');
    expect(BOOKING_STATUS.CONFIRMED).toBe('confirmed');
    expect(BOOKING_STATUS.CANCELLED).toBe('cancelled');
    expect(BOOKING_STATUS.EXPIRED).toBe('expired');
  });

  it('defines PAYMENT_STATUS', () => {
    expect(PAYMENT_STATUS.PAID).toBe(true);
    expect(PAYMENT_STATUS.UNPAID).toBe(false);
  });

  it('CANCELLABLE_STATUSES only includes PENDING', () => {
    expect(CANCELLABLE_STATUSES).toEqual(['pending']);
  });

  it('PAYABLE_STATUSES only includes PENDING', () => {
    expect(PAYABLE_STATUSES).toEqual(['pending']);
  });

  it('SERVICE_ELIGIBLE_STATUSES only includes CONFIRMED', () => {
    expect(SERVICE_ELIGIBLE_STATUSES).toEqual(['confirmed']);
  });
});

describe('FALLBACK_VALUES', () => {
  it('provides fallback strings', () => {
    expect(FALLBACK_VALUES.HOTEL_NAME).toBe('Hotel');
    expect(FALLBACK_VALUES.ROOM_TYPE).toBe('Room');
    expect(FALLBACK_VALUES.ADDRESS).toBe('Address unavailable');
  });
});
