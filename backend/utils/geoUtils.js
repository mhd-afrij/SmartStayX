// geoUtils.js — Geo helpers shared by trip logic: hotel location resolution and haversine distance.
import mongoose from "mongoose";
import Hotel from "../models/Hotel.js";
import Booking from "../models/Booking.js";

const EARTH_RADIUS_KM = 6371;
const toRad = (deg) => (deg * Math.PI) / 180;

// Great-circle distance between two { lat, lng } points in km.
export const haversineKm = (a, b) => {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(s));
};

// Resolves the canonical hotel for the authenticated user:
//   1. Explicit hotelId (verified against the user's scope) — super_admins may target any hotel.
//   2. assignedHotel (receptionists/managers synced from Clerk metadata).
//   3. First owned hotel (hotel_manager who registered the property).
//   4. First hotel booked by a guest (guests plan trips from hotels they stay at).
// Returns null when no hotel can be attributed to the user.
export const resolveUserHotel = async (user, requestedHotelId = null) => {
  if (!user) return null;

  if (requestedHotelId) {
    if (user.role === "super_admin") return Hotel.findById(requestedHotelId).lean();
    if (String(user.assignedHotel || "") === String(requestedHotelId)) {
      return Hotel.findById(requestedHotelId).lean();
    }
    if (user.role === "hotel_manager") {
      const owned = await Hotel.findOne({ _id: requestedHotelId, owner: user._id }).lean();
      if (owned) return owned;
    }
    return null;
  }

  if (user.assignedHotel) {
    const assigned = await Hotel.findById(user.assignedHotel).lean();
    if (assigned) return assigned;
  }

  if (user.role === "hotel_manager") {
    const owned = await Hotel.findOne({ owner: user._id }).lean();
    if (owned) return owned;
  }

  const booked = await Booking.findOne({ user: user._id })
    .sort({ createdAt: -1 })
    .populate("hotel", "name address city location country")
    .lean();
  if (booked?.hotel && typeof booked.hotel === "object") return booked.hotel;

  return null;
};

// Validates a Mongo id string without throwing on malformed input.
export const isValidObjectId = (value) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);
