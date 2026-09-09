// notificationHelper.js — Notification dispatch helper (email, push, in-app)
import Notification from "../models/Notification.js";
import PlatformSettings from "../models/PlatformSettings.js";
import logger from "../utils/logger.js";

// Notification factory — creates in-app notifications for owners on key booking events.
export const createNotification = async ({ hotel, type, title, message, booking, room }) => {
  try {
    await Notification.create({ hotel, type, title, message, booking, room });
  } catch (error) {
    console.error("Failed to create notification:", error.message);
  }
};

// Optional email dispatch. Enabled per-platform (PlatformSettings.inventory)
// and per-hotel (Hotel.settings.emailAlertsEnabled). Falls back gracefully —
// no SMTP provider is configured by default, so this logs rather than sends.
export const dispatchAlertEmail = async ({ hotelId, subject, body, recipients }) => {
  try {
    const settings = await PlatformSettings.getSettings();
    const enabledGlobally = settings?.inventory?.emailAlertsEnabled === true;
    if (!enabledGlobally) return;

    const Hotel = (await import("../models/Hotel.js")).default;
    const hotel = hotelId ? await Hotel.findById(hotelId).select("settings name").lean() : null;
    const hotelEnabled = hotel?.settings?.emailAlertsEnabled === true;
    const to = [
      ...(recipients || []),
      ...(hotel?.settings?.alertRecipients || []),
      ...(settings?.inventory?.recipients || []),
    ].filter(Boolean).filter((e, i, arr) => arr.indexOf(e) === i);

    if (!hotelEnabled || !to.length) return;

    // Substitute your real mail transport here (SendGrid, Nodemailer, SES…).
    // Keep the interface stable so enabling email later requires no route changes.
    logger.info(`[ALERT-EMAIL] To: ${to.join(", ")} | Subject: ${subject} | Body: ${body}`);
  } catch (error) {
    logger.warn("Alert email dispatch failed: %s", error.message);
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

// Low-stock alert: in-app notification (required) + optional email (configurable)
export const notifyLowStock = async ({ hotel, item, quantity, minStock }) => {
  const title = "Low Stock Alert";
  const message = `${item.name} is low on stock (${quantity} remaining, minimum ${minStock}).`;
  await createNotification({
    hotel,
    type: "low_stock",
    title,
    message,
  });
  await dispatchAlertEmail({
    hotelId: hotel,
    subject: title,
    body: message,
  });
};
