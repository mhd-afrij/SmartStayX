export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
}

export const PAYMENT_STATUS = {
  PAID: true,
  UNPAID: false,
}

export const PAYMENT_METHOD = {
  STRIPE: 'Stripe',
  PAY_AT_HOTEL: 'Pay At Hotel',
}

export const CANCELLABLE_STATUSES = [BOOKING_STATUS.PENDING]
export const PAYABLE_STATUSES = [BOOKING_STATUS.PENDING]
export const SERVICE_ELIGIBLE_STATUSES = [BOOKING_STATUS.CONFIRMED]
