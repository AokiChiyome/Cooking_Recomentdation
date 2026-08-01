import { z } from "zod";

export const dashboardLimitQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export const dashboardTrendQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).optional(),
});
