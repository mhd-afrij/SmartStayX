// refundService.js — Refund business logic: request, approve, process via Stripe, reject
import Refund from '../models/Refund.js';
import Booking from '../models/Booking.js';
import { getStripe } from '../utils/stripeUtil.js';
import { BOOKING_STATUS } from '../constants/bookingStatuses.js';

// Create a refund request for a paid booking
const requestRefund = async ({ bookingId, userId, reason }) => {
  const booking = await Booking.findOne({ _id: bookingId, user: userId });
  if (!booking) {
    throw Object.assign(new Error('Booking not found'), { status: 404 });
  }

  if (!booking.isPaid) {
    throw Object.assign(new Error('Booking is not paid, no refund needed'), { status: 400 });
  }

  if (booking.status === BOOKING_STATUS.CANCELLED) {
    throw Object.assign(new Error('Booking is already cancelled'), { status: 400 });
  }

  if (new Date(booking.checkInDate) <= new Date()) {
    throw Object.assign(new Error('Cannot refund after check-in date'), { status: 400 });
  }

  // Check for existing pending refund
  const existing = await Refund.findOne({
    booking: bookingId,
    status: { $in: ['requested', 'approved', 'processed'] },
  });
  if (existing) {
    throw Object.assign(new Error('A refund is already in progress for this booking'), { status: 400 });
  }

  const refund = await Refund.create({
    booking: bookingId,
    user: userId,
    amount: booking.totalPrice,
    currency: 'usd',
    reason: reason || '',
    status: 'requested',
  });

  return refund;
};

// Approve a refund request (owner/admin) and process via Stripe
const approveRefund = async ({ refundId, ownerId, decisionNote }) => {
  const refund = await Refund.findById(refundId).populate('booking');
  if (!refund) throw Object.assign(new Error('Refund not found'), { status: 404 });

  if (refund.status !== 'requested') {
    throw Object.assign(new Error(`Refund is already ${refund.status}`), { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    // Degrade gracefully: mark as approved without processing Stripe
    refund.status = 'approved';
    refund.decisionNote = decisionNote || 'Approved (Stripe not configured — manual refund required)';
    refund.processedBy = ownerId;
    await refund.save();
    return { refund, stripeProcessed: false };
  }

  const booking = refund.booking;
  if (!booking) {
    throw Object.assign(new Error('Associated booking not found'), { status: 404 });
  }

  try {
    // Attempt Stripe refund
    const refundResult = await stripe.refunds.create({
      payment_intent: booking.stripePaymentIntentId,
      amount: Math.round(refund.amount * 100),
    });

    refund.status = 'processed';
    refund.stripeRefundId = refundResult.id;
    refund.stripePaymentIntentId = booking.stripePaymentIntentId || null;
    refund.processedAt = new Date();
    refund.decisionNote = decisionNote || 'Approved and processed';
    refund.processedBy = ownerId;
    await refund.save();

    // Update booking status
    if (booking.status !== BOOKING_STATUS.CANCELLED) {
      booking.status = BOOKING_STATUS.CANCELLED;
      booking.isPaid = false;
      await booking.save();
    }

    return { refund, stripeProcessed: true };
  } catch (error) {
    refund.status = 'failed';
    refund.decisionNote = `Stripe refund failed: ${error.message}`;
    await refund.save();
    throw Object.assign(new Error(`Stripe refund failed: ${error.message}`), { status: 500 });
  }
};

// Reject a refund request
const rejectRefund = async ({ refundId, ownerId, decisionNote }) => {
  const refund = await Refund.findById(refundId);
  if (!refund) throw Object.assign(new Error('Refund not found'), { status: 404 });

  if (refund.status !== 'requested') {
    throw Object.assign(new Error(`Refund is already ${refund.status}`), { status: 400 });
  }

  refund.status = 'rejected';
  refund.decisionNote = decisionNote || 'Rejected';
  refund.processedBy = ownerId;
  await refund.save();
  return refund;
};

// List refunds with optional filters (owner view)
const listRefunds = async ({ bookingIds, status, page = 1, limit = 20 }) => {
  const query = {};
  if (bookingIds && bookingIds.length > 0) query.booking = { $in: bookingIds };
  if (status) query.status = status;

  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (p - 1) * l;

  const [refunds, total] = await Promise.all([
    Refund.find(query)
      .populate('booking', 'checkInDate checkOutDate totalPrice room guestDisplayName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l),
    Refund.countDocuments(query),
  ]);

  return { refunds, page: p, limit: l, total };
};

// Get user's refunds
const getUserRefunds = async ({ userId }) => {
  return Refund.find({ user: userId })
    .populate('booking', 'checkInDate checkOutDate totalPrice room guestDisplayName')
    .sort({ createdAt: -1 });
};

export default { requestRefund, approveRefund, rejectRefund, listRefunds, getUserRefunds };
