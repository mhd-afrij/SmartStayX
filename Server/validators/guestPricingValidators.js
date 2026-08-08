import { z } from 'zod';

export const valueQuery = z.object({
  city: z.string().optional(),
  hotelId: z.string().optional(),
  budget: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number().min(1).max(100000).optional()),
  roomType: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number().min(1).max(50).optional()),
});

export const datesQuery = z.object({
  roomId: z.string().optional(),
  hotelId: z.string().optional(),
  monthsAhead: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number().min(1).max(12).optional()),
});

export const forecastQuery = z.object({
  roomId: z.string({ message: 'roomId is required' }),
});

export default { valueQuery, datesQuery, forecastQuery };
