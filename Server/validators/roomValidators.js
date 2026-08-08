// roomValidators.js — Zod schemas for room request validation
import { z } from 'zod';

// Validates room listing query params: pagination, price range, type, destination, rating
export const getRoomsQuery = z.object({
  page: z.preprocess((v) => (v === undefined ? undefined : Number(v)), z.number().int().positive().optional()),
  limit: z.preprocess((v) => (v === undefined ? undefined : Number(v)), z.number().int().positive().optional()),
  roomType: z.string().optional(),
  minPrice: z.preprocess((v) => (v === undefined || v === '' ? undefined : Number(v)), z.number().nonnegative().optional()),
  maxPrice: z.preprocess((v) => (v === undefined || v === '' ? undefined : Number(v)), z.number().nonnegative().optional()),
  destination: z.string().optional(),
  minRating: z.preprocess((v) => (v === undefined || v === '' ? undefined : Number(v)), z.number().min(0).max(5).optional()),
});

// Validates room creation body: hotelId, roomType, pricePerNight, optional amenities
export const createRoomBody = z.object({
  hotelId: z.string().min(1),
  roomNumber: z.string().min(1),
  roomType: z.string().min(1),
  pricePerNight: z.preprocess((v) => Number(v), z.number().nonnegative()),
  amenities: z.string().optional(),
});

// Validates toggle-availability request: roomId
export const toggleAvailabilityBody = z.object({
  roomId: z.string().min(1),
});

// Validates room update body: optional roomType, price, amenities, isAvailable
export const updateRoomBody = z.object({
  roomNumber: z.string().optional(),
  roomType: z.string().optional(),
  pricePerNight: z.preprocess((v) => (v === undefined ? undefined : Number(v)), z.number().nonnegative().optional()),
  amenities: z.array(z.string()).optional(),
  isAvailable: z.preprocess((v) => (v === undefined ? undefined : Boolean(v)), z.boolean().optional()),
});

export default { getRoomsQuery, createRoomBody, toggleAvailabilityBody, updateRoomBody };
