// activityController.js — Activity/excursion/tour/transportation CRUD and booking
import activityService from "../services/activityService.js";

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
    const activity = await activityService.createActivity(req.body);
    res.json({ success: true, activity });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updateActivity = async (req, res) => {
  try {
    const activity = await activityService.updateActivity(req.params.id, req.body);
    res.json({ success: true, activity });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const deleteActivity = async (req, res) => {
  try {
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
    const booking = await activityService.updateBookingStatus(id, status);
    res.json({ success: true, message: "Status updated", booking });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
