import { z } from 'zod';

export const checkAvailabilityBody = z.object({
  room: z.string().min(1),
  checkInDate: z.string().min(1),
  checkOutDate: z.string().min(1),
});

export const createBookingBody = z.object({
  room: z.string().min(1),
  checkInDate: z.string().min(1),
  checkOutDate: z.string().min(1),
  guests: z.preprocess((v) => (v === undefined ? 1 : Number(v)), z.number().int().positive()),
});

export const bookingIdBody = z.object({
  bookingId: z.string().min(1),
});

export const sessionIdBody = z.object({
  sessionId: z.string().min(1),
});

export const modifyBookingBody = z.object({
  bookingId: z.string().min(1),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  guests: z.preprocess((v) => (v === undefined ? undefined : Number(v)), z.number().int().positive().optional()),
});

export const paymentMethodBody = z.object({
  bookingId: z.string().min(1),
  paymentMethod: z.string().min(1),
});

export const calculatePriceBody = z.object({
  roomId: z.string().min(1),
  checkInDate: z.string().min(1),
  checkOutDate: z.string().min(1),
  guests: z.preprocess((v) => (v === undefined ? 1 : Number(v)), z.number().int().positive()).optional(),
});

export default { checkAvailabilityBody, createBookingBody, bookingIdBody, modifyBookingBody, paymentMethodBody, sessionIdBody, calculatePriceBody };
