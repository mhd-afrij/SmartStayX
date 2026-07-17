// notificationHelper.js — Notification dispatch helper (email, push, in-app)
import Notification from "../models/Notification.js";

// Notification factory — creates in-app notifications for owners on key booking events.
export const createNotification = async ({ hotel, type, title, message, booking, room }) => {
  try {
    await Notification.create({ hotel, type, title, message, booking, room });
  } catch (error) {
    console.error("Failed to create notification:", error.message);
  }
};

// Notifies owner when a new booking is created
export const notifyNewBooking = async (booking) => {
  if (!booking?.hotel) return;
  const roomNum = booking.roomNumber || "";
  await createNotification({
    hotel: booking.hotel,
    type: "new_booking",
    title: "New Booking Received",
    message: `New booking${roomNum ? ` — Room ${roomNum}` : ""} has been confirmed.`,
    booking: booking._id,
    room: booking.room,
  });
};

// Notifies owner when payment for a booking is received
export const notifyPaymentReceived = async (booking) => {
  if (!booking?.hotel) return;
  const roomNum = booking.roomNumber || "";
  await createNotification({
    hotel: booking.hotel,
    type: "payment_received",
    title: "Payment Received",
    message: `Payment of $${booking.totalPrice || 0} received${roomNum ? ` for Room ${roomNum}` : ""}.`,
    booking: booking._id,
  });
};

// Notifies owner when a booking is cancelled
export const notifyCancellation = async (booking) => {
  if (!booking?.hotel) return;
  const roomNum = booking.roomNumber || "";
  await createNotification({
    hotel: booking.hotel,
    type: "cancellation",
    title: "Booking Cancelled",
    message: `Booking${roomNum ? ` for Room ${roomNum}` : ""} has been cancelled.`,
    booking: booking._id,
    room: booking.room,
  });
};

// Notifies owner when a guest requests a refund
export const notifyRefundRequest = async (booking, user) => {
  if (!booking?.hotel) return;
  const roomNum = booking.roomNumber || "";
  await createNotification({
    hotel: booking.hotel,
    type: "refund_request",
    title: "Refund Requested",
    message: `${user?.name || "A guest"} requested refund of $${booking.totalPrice || 0}${roomNum ? ` for Room ${roomNum}` : ""}.`,
    booking: booking._id,
    room: booking.room,
  });
};

// Notifies owner when a room is assigned/changed on a booking
export const notifyRoomAssigned = async (booking) => {
  if (!booking?.hotel) return;
  const roomNum = booking.roomNumber || "";
  await createNotification({
    hotel: booking.hotel,
    type: "room_assigned",
    title: "Room Assigned",
    message: `Room ${roomNum} has been assigned to booking.`,
    booking: booking._id,
    room: booking.room,
  });
};
