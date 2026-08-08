// bookingStatusService.js — Centralized booking status transition validation and application
import { BOOKING_STATUS } from '../constants/bookingStatuses.js';

// Define allowed transitions between booking statuses
const TRANSITIONS = {
  [BOOKING_STATUS.PENDING]: [
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.EXPIRED,
    BOOKING_STATUS.RESERVATION,
  ],
  [BOOKING_STATUS.RESERVATION]: [
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.EXPIRED,
  ],
  [BOOKING_STATUS.CONFIRMED]: [
    BOOKING_STATUS.CHECKED_IN,
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.CHECKED_OUT,
  ],
  [BOOKING_STATUS.CHECKED_IN]: [
    BOOKING_STATUS.CHECKED_OUT,
    BOOKING_STATUS.CANCELLED,
  ],
  [BOOKING_STATUS.CHECKED_OUT]: [],
  [BOOKING_STATUS.CANCELLED]: [],
  [BOOKING_STATUS.EXPIRED]: [],
};

// Validate if a transition from `from` to `to` is allowed
export const canTransition = (from, to) => {
  if (!from || !to) return false;
  if (from === to) return true; // No-op transitions are allowed
  const allowed = TRANSITIONS[from] || [];
  return allowed.includes(to);
};

// Apply a status transition with validation
export const transitionBookingStatus = async ({ booking, to, options = {} }) => {
  const { actor, reason } = options;
  const from = booking.status;

  if (!canTransition(from, to)) {
    const error = new Error(`Invalid booking status transition: ${from} → ${to}`);
    error.status = 400;
    throw error;
  }

  booking.status = to;

  // Track status history if the model supports it
  if (booking.statusHistory && Array.isArray(booking.statusHistory)) {
    booking.statusHistory.push({
      from,
      to,
      at: new Date(),
      actor: actor || null,
      reason: reason || null,
    });
  }

  await booking.save();
  return booking;
};

// Get all valid next statuses for a given status
export const getNextStatuses = (status) => TRANSITIONS[status] || [];

export default {
  canTransition,
  transitionBookingStatus,
  getNextStatuses,
};
