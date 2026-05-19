import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Review from "../models/Review.js";
import { BOOKING_STATUS } from "../constants/bookingStatuses.js";

const toSet = (arr = []) => new Set(arr.filter(Boolean).map((v) => String(v).toLowerCase()));

export const getUserRecommendations = async (req, res) => {
  try {
    const user = req.user;
    const limit = Math.min(Number(req.query.limit) || 10, 25);

    const bookings = await Booking.find({ user: user._id, status: { $ne: BOOKING_STATUS.CANCELLED } })
      .populate("room hotel")
      .sort({ createdAt: -1 })
      .limit(20);

    const preferredCities = toSet(user.recentSearchedCities || []);
    const amenityCount = {};
    let averageBudget = 0;

    bookings.forEach((booking) => {
      averageBudget += Number(booking.dynamicPricePerNight || booking.basePricePerNight || 0);
      const amenities = booking?.room?.amenities || [];
      amenities.forEach((amenity) => {
        const key = String(amenity).toLowerCase();
        amenityCount[key] = (amenityCount[key] || 0) + 1;
      });
      if (booking?.hotel?.city) preferredCities.add(String(booking.hotel.city).toLowerCase());
    });

    averageBudget = bookings.length > 0 ? averageBudget / bookings.length : 150;
    const preferredAmenities = Object.keys(amenityCount)
      .sort((a, b) => amenityCount[b] - amenityCount[a])
      .slice(0, 8);

    // ── Collaborative filtering: "Users who booked the same rooms also booked these" ──
    const bookedRoomIds = bookings.filter((b) => b.room?._id).map((b) => b.room._id);
    let collabRoomIds = new Set();
    if (bookedRoomIds.length > 0) {
      const similarBookings = await Booking.aggregate([
        { $match: { room: { $in: bookedRoomIds }, status: { $ne: BOOKING_STATUS.CANCELLED } } },
        { $group: { _id: "$user", rooms: { $addToSet: "$room" } } },
        { $unwind: "$rooms" },
        { $group: { _id: null, recommendedRoomIds: { $addToSet: "$rooms" } } },
      ]);
      if (similarBookings.length > 0) {
        similarBookings[0].recommendedRoomIds.forEach((id) => {
          if (!bookedRoomIds.some((bid) => bid.toString() === id.toString())) {
            collabRoomIds.add(id.toString());
          }
        });
      }
    }

    const allBookedHotelIds = bookings.filter((b) => b.hotel?._id).map((b) => b.hotel._id);

    const rooms = await Room.find({ isAvailable: true }).populate("hotel").limit(120);

    // ── Fetch average review ratings for rooms ──
    const roomIds = rooms.map((r) => r._id);
    const ratingAgg = await Review.aggregate([
      { $match: { room: { $in: roomIds } } },
      { $group: { _id: "$room", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    const ratingMap = {};
    ratingAgg.forEach((r) => { ratingMap[r._id.toString()] = r; });

    const scored = rooms.map((room) => {
      let score = 0;
      const city = String(room.hotel?.city || "").toLowerCase();
      const roomIdStr = room._id.toString();

      // Content-based signals (from user's history)
      if (preferredCities.has(city)) score += 25;

      const roomAmenities = (room.amenities || []).map((a) => String(a).toLowerCase());
      const overlap = roomAmenities.filter((a) => preferredAmenities.includes(a)).length;
      score += overlap * 6;

      const price = Number(room.pricePerNight || 0);
      const budgetGap = Math.abs(price - averageBudget);
      score += Math.max(0, 25 - budgetGap / 8);

      const popularityBoost = Math.min(15, Math.floor((roomAmenities.length || 0) * 1.5));
      score += popularityBoost;

      // Collaborative signal: +30 if "users also booked" this room
      if (collabRoomIds.has(roomIdStr)) score += 30;

      // Review rating boost: up to +15 based on avg rating
      const ratingInfo = ratingMap[roomIdStr];
      if (ratingInfo) {
        const avgRating = ratingInfo.avgRating || 0;
        const reviewCount = ratingInfo.count || 0;
        score += Math.min(15, (avgRating / 5) * 10 + Math.min(5, reviewCount));
      }

      // Same-hotel boost: +10 if user has booked another room at this hotel
      if (room.hotel?._id && allBookedHotelIds.some((hid) => hid.toString() === room.hotel._id.toString())) {
        score += 10;
      }

      const reasons = [];
      if (preferredCities.has(city)) reasons.push("Matches your destination interests");
      if (overlap > 0) reasons.push(`Matches ${overlap} of your preferred amenities`);
      if (collabRoomIds.has(roomIdStr)) reasons.push("Popular among guests with similar stays");
      if (ratingInfo?.avgRating >= 4) reasons.push(`Highly rated (${ratingInfo.avgRating.toFixed(1)}⭐)`);
      if (room.hotel?._id && allBookedHotelIds.some((hid) => hid.toString() === room.hotel._id.toString())) {
        reasons.push("You've stayed at this hotel before");
      }
      reasons.push("Ranked for value and relevance");

      return {
        ...room.toObject(),
        recommendationScore: Number(score.toFixed(2)),
        recommendationReason: reasons,
      };
    });

    scored.sort((a, b) => b.recommendationScore - a.recommendationScore);

    res.json({
      success: true,
      strategy: "hybrid-collaborative-content",
      meta: {
        preferredCities: Array.from(preferredCities),
        preferredAmenities,
        averageBudget: Number(averageBudget.toFixed(2)),
        collaborativeRoomCount: collabRoomIds.size,
      },
      rooms: scored.slice(0, limit),
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
