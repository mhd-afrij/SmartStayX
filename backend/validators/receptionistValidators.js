// receptionistValidators.js — Zod schemas for receptionist route mutation bodies
import { z } from "zod";

const mongoId = z.string().min(1, "Must be an ID");
const dateString = z.string().min(1, "Date is required");
const booleanish = z.preprocess(
  (v) => (v === "true" ? true : v === "false" ? false : v),
  z.boolean()
);
const price = z.preprocess(
  (v) => (v === undefined || v === null || v === "" ? undefined : Number(v)),
  z.number().nonnegative("Price must be non-negative")
);
const guestCount = z.preprocess((v) => Number(v), z.number().int().positive("Guests must be a positive integer"));

const paymentMethods = ["Cash", "Card", "Online", "Pay At Hotel", "unpaid"];

export const createReservationBody = z.object({
  guestName: z.string().trim().min(1, "Guest name is required"),
  guestEmail: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  hotelId: mongoId,
  roomId: mongoId,
  checkInDate: dateString,
  checkOutDate: dateString,
  guests: guestCount,
  paymentMethod: z.enum(paymentMethods).optional(),
  notes: z.string().optional(),
});

export const updateReservationBody = z.object({
  guestName: z.string().trim().min(1).optional(),
  guestEmail: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  roomId: mongoId.optional(),
  checkInDate: dateString.optional(),
  checkOutDate: dateString.optional(),
  guests: guestCount.optional(),
  paymentMethod: z.enum(paymentMethods).optional(),
});

export const updateReservationStatusBody = z.object({
  status: z.enum(["confirmed", "checked_in", "checked_out", "cancelled"]),
});

export const markPaymentReceivedBody = z.object({
  paymentMethod: z.enum(paymentMethods).optional(),
});

export const frontDeskCheckinBody = z.object({
  bookingId: mongoId,
  documentType: z.string().trim().optional(),
  documentNumber: z.string().trim().optional(),
  roomId: mongoId.optional(),
  paymentMethod: z.enum(paymentMethods).optional(),
});

export const frontDeskCheckoutBody = z.object({
  bookingId: mongoId,
  extraCharges: z
    .array(
      z.object({
        description: z.string().trim().min(1),
        amount: z.number().positive(),
      })
    )
    .optional(),
  paymentMethod: z.enum(paymentMethods).optional(),
  note: z.string().trim().optional(),
});

export const createRoomBody = z.object({
  roomNumber: z.string().trim().min(1, "Room number is required"),
  roomType: z.string().trim().min(1, "Room type is required"),
  pricePerNight: price,
  amenities: z.array(z.string()).optional(),
  hotelId: mongoId,
  images: z.array(z.string()).optional(),
});

export const updateRoomBody = z.object({
  roomNumber: z.string().trim().min(1).optional(),
  roomType: z.string().trim().min(1).optional(),
  pricePerNight: price.optional(),
  amenities: z.array(z.string()).optional(),
  isAvailable: booleanish.optional(),
});

export const updateRoomStatusBody = z.object({
  status: z.enum(["available", "occupied", "reserved", "cleaning", "maintenance", "out_of_service"]),
});

export const updateServiceStatusBody = z.object({
  status: z.enum(["pending", "assigned", "completed", "cancelled"]),
});

export const assignServiceBody = z.object({
  assignedTo: z.string().nullable().optional(),
});

export const createOfferBody = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  discountPercent: z.preprocess(
    (v) => (v === undefined || v === null || v === "" ? undefined : Number(v)),
    z.number().min(0).max(100)
  ),
  expiryDate: dateString,
  roomId: mongoId,
  hotelId: mongoId,
  image: z.string().optional(),
});

export const updateOfferBody = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  discountPercent: z.preprocess(
    (v) => (v === undefined || v === null || v === "" ? undefined : Number(v)),
    z.number().min(0).max(100).optional()
  ),
  expiryDate: dateString.optional(),
  isActive: booleanish.optional(),
});

export default {
  createReservationBody,
  updateReservationBody,
  updateReservationStatusBody,
  markPaymentReceivedBody,
  frontDeskCheckinBody,
  frontDeskCheckoutBody,
  createRoomBody,
  updateRoomBody,
  updateRoomStatusBody,
  updateServiceStatusBody,
  assignServiceBody,
  createOfferBody,
  updateOfferBody,
};