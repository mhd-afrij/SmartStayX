// analyticsValidators.js — Zod schemas for analytics queries
import { z } from 'zod';

export const analyticsQuery = z.object({
  hotelId: z.string().min(1).optional(),
  range: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
  granularity: z.enum(["day", "week", "month"]).default("day"),
});

export const destinationQuery = z.object({
  limit: z.preprocess((v) => Number(v), z.number().int().min(1).max(50)).optional(),
});

export default { analyticsQuery, destinationQuery };
