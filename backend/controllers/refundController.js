// refundController.js — Refund request handling: create, list, approve, reject
import refundService from '../services/refundService.js';
import Hotel from '../models/Hotel.js';
import Booking from '../models/Booking.js';
import { ok, badRequest, notFound, forbidden } from '../utils/apiResponse.js';

// User requests a refund for a paid booking
export const requestRefund = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { bookingId, reason } = req.body;

    if (!bookingId) return badRequest(res, 'bookingId is required');

    const refund = await refundService.requestRefund({
      bookingId,
      userId,
      reason,
    });

    ok(res, { message: 'Refund requested successfully', refund }, 201);
  } catch (error) {
    if (error.status === 404) return notFound(res, error.message);
    if (error.status === 400) return badRequest(res, error.message);
    next(error);
  }
};

// User lists their refunds
export const getUserRefunds = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const refunds = await refundService.getUserRefunds({ userId });
    ok(res, { refunds });
  } catch (error) {
    next(error);
  }
};

// Owner lists refunds for their hotels
export const listOwnerRefunds = async (req, res, next) => {
  try {
    const ownerId = req.user?._id || req.user?.id;
    const { status, page, limit, hotelId } = req.query;

    // Find owner's hotels
    const ownedHotels = await Hotel.find({ owner: ownerId }).select('_id');
    const ownedHotelIds = ownedHotels.map((h) => h._id);

    // If hotelId specified, verify ownership
    let hotelIds = ownedHotelIds;
    if (hotelId && hotelId !== 'all') {
      const isOwned = ownedHotelIds.some((id) => String(id) === String(hotelId));
      if (!isOwned) return forbidden(res, 'Not authorized for this hotel');
      hotelIds = [hotelId];
    }

    // Find bookings belonging to owner's hotels
    const bookings = await Booking.find({ hotel: { $in: hotelIds } }).select('_id');
    const bookingIds = bookings.map((b) => b._id);

    const result = await refundService.listRefunds({
      bookingIds,
      status,
      page,
      limit,
    });

    ok(res, result);
  } catch (error) {
    next(error);
  }
};

// Owner approves a refund (processes Stripe refund if configured)
export const approveRefund = async (req, res, next) => {
  try {
    const ownerId = req.user?._id || req.user?.id;
    const { refundId } = req.params;
    const { decisionNote } = req.body;

    if (!refundId) return badRequest(res, 'refundId is required');

    const result = await refundService.approveRefund({
      refundId,
      ownerId,
      decisionNote,
    });

    const message = result.stripeProcessed
      ? 'Refund approved and processed'
      : 'Refund approved (Stripe not configured — manual refund required)';

    ok(res, { message, refund: result.refund });
  } catch (error) {
    if (error.status === 404) return notFound(res, error.message);
    if (error.status === 400) return badRequest(res, error.message);
    next(error);
  }
};

// Owner rejects a refund request
export const rejectRefund = async (req, res, next) => {
  try {
    const ownerId = req.user?._id || req.user?.id;
    const { refundId } = req.params;
    const { decisionNote } = req.body;

    if (!refundId) return badRequest(res, 'refundId is required');

    const refund = await refundService.rejectRefund({
      refundId,
      ownerId,
      decisionNote,
    });

    ok(res, { message: 'Refund rejected', refund });
  } catch (error) {
    if (error.status === 404) return notFound(res, error.message);
    if (error.status === 400) return badRequest(res, error.message);
    next(error);
  }
};
