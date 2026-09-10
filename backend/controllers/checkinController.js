// checkinController.js — Guest self-service check-in flow with document upload and verification
import Checkin from "../models/Checkin.js";
import Booking from "../models/Booking.js";
import Notification from "../models/Notification.js";
import Hotel from "../models/Hotel.js";
import { BOOKING_STATUS } from "../constants/bookingStatuses.js";

// Verifies the acting user may operate on check-ins at `hotelId`.
// Allowed: super_admin (global), the hotel's owner, or a receptionist/
// manager assigned to that hotel. Returns true or sends 403 + false.
const assertCheckinScope = async (req, res, hotelId) => {
  if (req.user?.role === "super_admin") return true;
  if (!hotelId) {
    res.json({ success: false, message: "Hotel not found for this check-in" });
    return false;
  }
  if (String(req.user?.assignedHotel) === String(hotelId)) return true;
  const hotel = await Hotel.findById(hotelId).select("owner").lean();
  if (hotel && String(hotel.owner) === String(req.user?._id)) return true;
  res.json({ success: false, message: "Not authorized for this hotel's check-ins" });
  return false;
};

export const initiateCheckin = async (req, res) => {
  try {
    const { bookingId, documents, vehicleInfo, estimatedArrivalTime, specialRequests } = req.body;
    const userId = req.user._id;

    const booking = await Booking.findOne({ _id: bookingId, user: userId })
      .populate("room hotel");
    if (!booking) return res.json({ success: false, message: "Booking not found" });
    if (booking.status !== BOOKING_STATUS.CONFIRMED) {
      return res.json({ success: false, message: "Only confirmed bookings can check in" });
    }

    const existing = await Checkin.findOne({ booking: bookingId });
    if (existing) {
      return res.json({ success: false, message: "Check-in already initiated", checkin: existing });
    }

    const checkin = await Checkin.create({
      booking: bookingId,
      user: userId,
      hotel: booking.hotel._id,
      documents: documents || [],
      vehicleInfo: vehicleInfo || {},
      estimatedArrivalTime: estimatedArrivalTime || "",
      specialRequests: specialRequests || "",
      status: "pending",
    });

    await Notification.create({
      hotel: booking.hotel._id,
      type: "check_in",
      title: "Guest Check-in Initiated",
      message: `${req.user.name || "A guest"} has initiated self check-in.`,
      booking: bookingId,
      room: booking.room,
    });

    res.json({ success: true, message: "Check-in initiated", checkin });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getCheckinStatus = async (req, res) => {
  try {
    const { bookingId } = req.query;
    const checkin = await Checkin.findOne({ booking: bookingId, user: req.user._id })
      .populate("booking", "checkInDate checkOutDate status");
    if (!checkin) return res.json({ success: false, message: "No check-in found" });
    res.json({ success: true, checkin });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getUserCheckins = async (req, res) => {
  try {
    const checkins = await Checkin.find({ user: req.user._id })
      .populate("booking", "checkInDate checkOutDate status")
      .populate("hotel", "name city")
      .sort({ createdAt: -1 });
    res.json({ success: true, checkins });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const approveCheckin = async (req, res) => {
  try {
    const { id } = req.params;
    const checkin = await Checkin.findById(id).populate("booking");
    if (!checkin) return res.json({ success: false, message: "Check-in not found" });

    if (!(await assertCheckinScope(req, res, checkin.hotel))) return;

    checkin.status = "approved";
    await checkin.save();

    if (checkin.booking) {
      checkin.booking.status = BOOKING_STATUS.CHECKED_IN;
      await checkin.booking.save();
    }

    res.json({ success: true, message: "Check-in approved", checkin });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const completeCheckout = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user._id;

    const booking = await Booking.findOne({ _id: bookingId, user: userId });
    if (!booking) return res.json({ success: false, message: "Booking not found" });

    booking.status = BOOKING_STATUS.CHECKED_OUT;
    await booking.save();

    await Checkin.findOneAndUpdate(
      { booking: bookingId },
      { status: BOOKING_STATUS.CHECKED_OUT, checkedOutAt: new Date() },
    );

    res.json({ success: true, message: "Checkout completed" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getHotelCheckins = async (req, res) => {
  try {
    const { hotelId, status } = req.query;

    // Scoped staff may only view check-ins for their assigned hotel; the
    // hotel owner and super_admin may query any of their properties.
    let scopeHotelId = hotelId;
    if (req.user?.role !== "super_admin") {
      const hotel = hotelId
        ? await Hotel.findById(hotelId).select("owner").lean()
        : null;
      const ownsHotel = Boolean(hotel && String(hotel.owner) === String(req.user?._id));
      const assignedMatches = req.user?.assignedHotel && String(req.user.assignedHotel) === String(hotelId);
      if (!ownsHotel && !assignedMatches) {
        return res.json({ success: false, message: "Not authorized for this hotel's check-ins" });
      }
      scopeHotelId = hotelId || req.user.assignedHotel;
    }

    const query = {};
    if (scopeHotelId) query.hotel = scopeHotelId;
    if (status) query.status = status;

    const checkins = await Checkin.find(query)
      .populate("user", "name email username")
      .populate("booking", "checkInDate checkOutDate roomNumber guests")
      .sort({ createdAt: -1 });
    res.json({ success: true, checkins });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
