import Booking from "../models/Booking.js";
import Review from "../models/Review.js";
import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js";
import { BOOKING_STATUS } from "../constants/bookingStatuses.js";

// Review CRUD, owner moderation, and satisfaction breakdown aggregation.
const allowedSatisfaction = new Set([
  "very_satisfied",
  "satisfied",
  "neutral",
  "dissatisfied",
  "very_dissatisfied",
]);

export const getRoomReviews = async (req, res) => {
  try {
    const { roomId } = req.params;

    const reviews = await Review.find({ room: roomId, isVisible: true })
      .populate("user", "name username image")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Number((reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / totalReviews).toFixed(1))
        : 0;

    const satisfactionBreakdown = {
      very_satisfied: 0,
      satisfied: 0,
      neutral: 0,
      dissatisfied: 0,
      very_dissatisfied: 0,
    };

    for (const review of reviews) {
      if (satisfactionBreakdown[review.satisfaction] !== undefined) {
        satisfactionBreakdown[review.satisfaction] += 1;
      }
    }

    const mappedReviews = reviews.map((review) => ({
      _id: review._id,
      user: review.user,
      rating: review.rating,
      satisfaction: review.satisfaction,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      guestName: review.user?.name || review.user?.username || "Guest",
    }));

    return res.json({
      success: true,
      roomId,
      averageRating,
      totalReviews,
      satisfactionBreakdown,
      reviews: mappedReviews,
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const createOrUpdateRoomReview = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?._id;
    const { rating, satisfaction, comment } = req.body;

    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const safeSatisfaction = String(satisfaction || "").trim();
    if (!allowedSatisfaction.has(safeSatisfaction)) {
      return res.json({ success: false, message: "Please select a valid satisfaction option" });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.json({ success: false, message: "Room not found" });
    }

    const eligibleBooking = await Booking.findOne({
      user: userId,
      room: roomId,
      status: BOOKING_STATUS.CONFIRMED,
      isPaid: true,
    }).sort({ checkOutDate: -1 });

    if (!eligibleBooking) {
      return res.json({
        success: false,
        message: "Only guests with a paid confirmed booking can review this room",
      });
    }

    const review = await Review.findOneAndUpdate(
      { user: userId, room: roomId },
      {
        user: userId,
        room: roomId,
        hotel: room.hotel,
        booking: eligibleBooking._id,
        rating: numericRating,
        satisfaction: safeSatisfaction,
        comment: String(comment || "").trim(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("user", "name username image");

    return res.json({ success: true, message: "Review saved successfully", review });
  } catch (error) {
    if (error?.code === 11000) {
      return res.json({ success: false, message: "You already reviewed this room" });
    }
    return res.json({ success: false, message: error.message });
  }
};

export const getOwnerReviews = async (req, res) => {
  try {
    const ownerId = req.user?._id;
    if (!ownerId) {
      return res.json({ success: false, message: "Not authenticated" });
    }

    const ownedHotels = await Hotel.find({ owner: ownerId }).select("_id name");
    if (!ownedHotels.length) {
      return res.json({ success: true, reviews: [], hotels: [] });
    }

    const ownedHotelIds = ownedHotels.map((h) => h._id);

    const reviews = await Review.find({ hotel: { $in: ownedHotelIds } })
      .populate("user", "name username image")
      .populate("room", "roomType roomNumber")
      .populate("hotel", "name")
      .sort({ createdAt: -1 });

    return res.json({ success: true, reviews, hotels: ownedHotels });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const toggleReviewVisibility = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const ownerId = req.user?._id;

    if (!ownerId) {
      return res.json({ success: false, message: "Not authenticated" });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.json({ success: false, message: "Review not found" });
    }

    const hotel = await Hotel.findById(review.hotel);
    if (!hotel || String(hotel.owner) !== String(ownerId)) {
      return res.json({ success: false, message: "Not authorized to modify this review" });
    }

    review.isVisible = !review.isVisible;
    await review.save();

    return res.json({ success: true, message: "Review visibility updated", isVisible: review.isVisible });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
