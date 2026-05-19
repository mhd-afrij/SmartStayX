import Notification from "../models/Notification.js";

export const createNotification = async ({ hotel, type, title, message, booking, room }) => {
  try {
    await Notification.create({ hotel, type, title, message, booking, room });
  } catch (error) {
    console.error("Failed to create notification:", error.message);
  }
};

export const notifyNewBooking = async (booking) => {
  if (!booking?.hotel) return;
  await createNotification({
    hotel: booking.hotel,
    type: "new_booking",
    title: "New Booking Received",
    message: `A new booking has been made${booking.room ? ` for ${booking.room.roomType || "a room"}` : ""}.`,
    booking: booking._id,
    room: booking.room,
  });
};

export const notifyPaymentReceived = async (booking) => {
  if (!booking?.hotel) return;
  await createNotification({
    hotel: booking.hotel,
    type: "payment_received",
    title: "Payment Received",
    message: `Payment of $${booking.totalPrice || 0} has been received.`,
    booking: booking._id,
  });
};

export const notifyCancellation = async (booking) => {
  if (!booking?.hotel) return;
  await createNotification({
    hotel: booking.hotel,
    type: "cancellation",
    title: "Booking Cancelled",
    message: `A booking has been cancelled${booking.room ? ` for ${booking.room.roomType || "a room"}` : ""}.`,
    booking: booking._id,
    room: booking.room,
  });
};
