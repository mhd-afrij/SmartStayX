// roomAssignmentService.js — Auto room assignment based on guest preferences
import Room from "../models/Room.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { BOOKING_STATUS } from "../constants/bookingStatuses.js";

class RoomAssignmentService {
  async findBestRoom({ hotelId, checkInDate, checkOutDate, guests, userId, preferredRoomType } = {}) {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // Get user preferences if not explicitly provided
    let preferredType = preferredRoomType;
    let preferredAmenities = [];
    if (userId && !preferredRoomType) {
      const user = await User.findById(userId).lean();
      if (user?.profile?.preferences) {
        preferredType = preferredType || user.profile.preferences.roomType || "";
        preferredAmenities = user.profile.preferences.amenities || [];
      }
    }

    // Find all available rooms at the hotel
    const query = { hotel: hotelId, isAvailable: true };
    if (preferredType) query.roomType = { $regex: preferredType, $options: "i" };
    let availableRooms = await Room.find(query).lean();

    // Filter out rooms already booked for the requested dates
    const bookedRoomIds = await Booking.distinct("room", {
      hotel: hotelId,
      checkInDate: { $lt: checkOut },
      checkOutDate: { $gt: checkIn },
      status: { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.EXPIRED] },
    });

    availableRooms = availableRooms.filter((r) => !bookedRoomIds.some((bid) => String(bid) === String(r._id)));

    if (availableRooms.length === 0) {
      // Fallback: try any room type at the hotel
      const fallbackRooms = await Room.find({ hotel: hotelId, isAvailable: true }).lean();
      const fallbackAvailable = fallbackRooms.filter(
        (r) => !bookedRoomIds.some((bid) => String(bid) === String(r._id))
      );
      if (fallbackAvailable.length === 0) return null;

      return this.scoreAndPickBest(fallbackAvailable, preferredAmenities);
    }

    return this.scoreAndPickBest(availableRooms, preferredAmenities);
  }

  scoreAndPickBest(rooms, preferredAmenities = []) {
    const scored = rooms.map((room) => {
      let score = 0;
      const amenities = room.amenities || [];

      // Prefer rooms with more amenities matching guest preferences
      if (preferredAmenities.length > 0) {
        const matchCount = preferredAmenities.filter((pa) =>
          amenities.some((a) => String(a).toLowerCase() === String(pa).toLowerCase())
        ).length;
        score += matchCount * 10;
      }

      // Bonus for having any amenities at all
      score += Math.min(amenities.length * 2, 20);

      return { room, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].room;
  }

  async assignRoom(bookingId, userId) {
    const booking = await Booking.findById(bookingId).populate("room hotel");
    if (!booking) throw Object.assign(new Error("Booking not found"), { status: 404 });
    if (booking.status !== BOOKING_STATUS.PENDING && booking.status !== BOOKING_STATUS.CONFIRMED) {
      throw Object.assign(new Error("Can only assign rooms for pending or confirmed bookings"), { status: 400 });
    }

    const bestRoom = await this.findBestRoom({
      hotelId: booking.hotel._id,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      guests: booking.guests,
      userId: booking.user,
    });

    if (!bestRoom) throw Object.assign(new Error("No suitable room available for auto-assignment"), { status: 404 });

    booking.room = bestRoom._id;
    booking.roomNumber = bestRoom.roomNumber || "";
    await booking.save();

    return { booking, assignedRoom: bestRoom };
  }
}

export default new RoomAssignmentService();
