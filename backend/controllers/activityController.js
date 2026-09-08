// activityController.js — Activity/excursion/tour/transportation CRUD and booking
import activityService from "../services/activityService.js";
import Hotel from "../models/Hotel.js";
import { ActivityBooking } from "../models/ActivityBooking.js";

// True when the acting user owns the hotel the activity belongs to.
const isOwnerOf = async (userId, hotelId) => {
  if (!userId || !hotelId) return false;
  return Boolean(await Hotel.exists({ _id: hotelId, owner: userId }));
};

// Staff (owner or assigned receptionist) of `hotelId`? super_admin bypasses.
const canManageHotel = async (req, hotelId) => {
  if (req.user?.role === "super_admin") return true;
  if (req.user?.assignedHotel && String(req.user.assignedHotel) === String(hotelId)) return true;
  return isOwnerOf(req.user?._id, hotelId);
};

// Extracts the hotelId for an activity doc (ObjectId or string).
const hotelIdOf = (activity) => activity?.hotel?._id || activity?.hotel || null;

export const getActivities = async (req, res) => {
  try {
    const { hotelId, category } = req.query;
    const activities = await activityService.getActivities({ hotelId, category });
    res.json({ success: true, activities });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getActivityById = async (req, res) => {
  try {
    const activity = await activityService.getActivityById(req.params.id);
    res.json({ success: true, activity });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const createActivity = async (req, res) => {
  try {
    if (!(await canManageHotel(req, req.body?.hotel))) {
      return res.json({ success: false, message: "Not authorized for this hotel" });
    }
    const activity = await activityService.createActivity(req.body);
    res.json({ success: true, activity });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updateActivity = async (req, res) => {
  try {
    const existing = await activityService.getActivityById(req.params.id);
    if (!(await canManageHotel(req, hotelIdOf(existing)))) {
      return res.json({ success: false, message: "Not authorized for this hotel" });
    }
    const activity = await activityService.updateActivity(req.params.id, req.body);
    res.json({ success: true, activity });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const deleteActivity = async (req, res) => {
  try {
    const existing = await activityService.getActivityById(req.params.id);
    if (!(await canManageHotel(req, hotelIdOf(existing)))) {
      return res.json({ success: false, message: "Not authorized for this hotel" });
    }
    await activityService.deleteActivity(req.params.id);
    res.json({ success: true, message: "Activity deleted" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const bookActivity = async (req, res) => {
  try {
    const { activityId, hotelId, bookingDate, participants, specialRequests } = req.body;
    const booking = await activityService.bookActivity({
      userId: req.user._id,
      activityId,
      hotelId,
      bookingDate,
      participants: participants || 1,
      specialRequests,
    });
    res.json({ success: true, message: "Activity booked successfully", booking });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getUserActivityBookings = async (req, res) => {
  try {
    const bookings = await activityService.getUserBookings(req.user._id);
    res.json({ success: true, bookings });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const cancelActivityBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await activityService.cancelBooking(bookingId, req.user._id);
    res.json({ success: true, message: "Booking cancelled", booking });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getHotelActivityBookings = async (req, res) => {
  try {
    const { hotelId } = req.query;
    if (!(await canManageHotel(req, hotelId))) {
      return res.json({ success: false, message: "Not authorized for this hotel" });
    }
    const bookings = await activityService.getHotelBookings(hotelId);
    res.json({ success: true, bookings });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updateActivityBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    // Verify the booking's hotel is within the acting user's scope.
    const existing = await ActivityBooking.findById(id).select("hotel").lean();
    if (!existing) return res.json({ success: false, message: "Booking not found" });
    if (!(await canManageHotel(req, existing.hotel))) {
      return res.json({ success: false, message: "Not authorized for this booking" });
    }
    const booking = await activityService.updateBookingStatus(id, status);
    res.json({ success: true, message: "Status updated", booking });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
