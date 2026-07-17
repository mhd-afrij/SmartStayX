// pricingValidators.js — Zod schemas for dynamic pricing requests
import { z } from 'zod';

export const suggestPricingQuery = z.object({
  hotelId: z.string().min(1),
  roomType: z.string().optional(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
});

export const updatePriceBody = z.object({
  roomId: z.string().min(1),
  suggestedPrice: z.preprocess((v) => Number(v), z.number().min(0)),
});

export default { suggestPricingQuery, updatePriceBody };
