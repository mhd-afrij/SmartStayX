// BOOKING_STATUS — Booking lifecycle status constants
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  RESERVATION: 'reservation',
}

// PAYMENT_STATUS — Boolean payment status constants
export const PAYMENT_STATUS = {
  PAID: true,
  UNPAID: false,
}

// PAYMENT_METHOD — Supported payment method names
export const PAYMENT_METHOD = {
  STRIPE: 'Stripe',
  PAY_AT_HOTEL: 'Pay At Hotel',
}

// CANCELLABLE_STATUSES — Booking statuses that allow cancellation
export const CANCELLABLE_STATUSES = [BOOKING_STATUS.PENDING]
// PAYABLE_STATUSES — Booking statuses that allow payment
export const PAYABLE_STATUSES = [BOOKING_STATUS.PENDING]
// SERVICE_ELIGIBLE_STATUSES — Booking statuses eligible for room service requests
export const SERVICE_ELIGIBLE_STATUSES = [BOOKING_STATUS.CONFIRMED]
