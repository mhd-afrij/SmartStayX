// activityService.js — Business logic for activity/excursion/tour/transportation booking
import { Activity, ActivityBooking } from "../models/ActivityBooking.js";
import Hotel from "../models/Hotel.js";

class ActivityService {
  async getActivities({ hotelId, category, isActive = true } = {}) {
    const query = {};
    if (hotelId) query.hotel = hotelId;
    if (category) query.category = category;
    if (isActive) query.isActive = true;

    return Activity.find(query).sort({ category: 1, price: 1 }).lean();
  }

  async getActivityById(activityId) {
    const activity = await Activity.findById(activityId).lean();
    if (!activity) throw Object.assign(new Error("Activity not found"), { status: 404 });
    return activity;
  }

  async createActivity(data) {
    const hotel = await Hotel.findById(data.hotel);
    if (!hotel) throw Object.assign(new Error("Hotel not found"), { status: 404 });
    return Activity.create(data);
  }

  async updateActivity(activityId, data) {
    const activity = await Activity.findByIdAndUpdate(activityId, { $set: data }, { new: true });
    if (!activity) throw Object.assign(new Error("Activity not found"), { status: 404 });
    return activity;
  }

  async deleteActivity(activityId) {
    const activity = await Activity.findByIdAndDelete(activityId);
    if (!activity) throw Object.assign(new Error("Activity not found"), { status: 404 });
    return { success: true };
  }

  async bookActivity({ userId, activityId, hotelId, bookingDate, participants, specialRequests }) {
    const activity = await Activity.findById(activityId);
    if (!activity) throw Object.assign(new Error("Activity not found"), { status: 404 });
    if (!activity.isActive) throw Object.assign(new Error("Activity is no longer available"), { status: 400 });

    if (activity.availableSlots < participants) {
      throw Object.assign(
        new Error(`Only ${activity.availableSlots} slots available for this activity`),
        { status: 400 },
      );
    }

    if (participants > activity.maxParticipants) {
      throw Object.assign(
        new Error(`Maximum ${activity.maxParticipants} participants allowed`),
        { status: 400 },
      );
    }

    const totalPrice = activity.price * participants;

    const booking = await ActivityBooking.create({
      user: userId,
      activity: activityId,
      hotel: hotelId,
      bookingDate: new Date(bookingDate),
      participants,
      totalPrice,
      specialRequests: specialRequests || "",
      status: "confirmed",
    });

    // Decrease available slots
    activity.availableSlots -= participants;
    await activity.save();

    return booking.populate("activity");
  }

  async getUserBookings(userId) {
    return ActivityBooking.find({ user: userId })
      .populate("activity", "name description category price images duration")
      .populate("hotel", "name city")
      .sort({ bookingDate: -1 })
      .lean();
  }

  async cancelBooking(bookingId, userId) {
    const booking = await ActivityBooking.findOne({ _id: bookingId, user: userId });
    if (!booking) throw Object.assign(new Error("Booking not found"), { status: 404 });
    if (booking.status === "cancelled") throw Object.assign(new Error("Already cancelled"), { status: 400 });

    booking.status = "cancelled";
    await booking.save();

    // Restore slots
    await Activity.findByIdAndUpdate(booking.activity, { $inc: { availableSlots: booking.participants } });

    return booking;
  }

  async getHotelBookings(hotelId) {
    return ActivityBooking.find({ hotel: hotelId })
      .populate("activity", "name category price")
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();
  }

  async updateBookingStatus(bookingId, status) {
    const booking = await ActivityBooking.findByIdAndUpdate(
      bookingId,
      { $set: { status } },
      { new: true },
    ).populate("activity");
    if (!booking) throw Object.assign(new Error("Booking not found"), { status: 404 });
    return booking;
  }
}

export default new ActivityService();
