import { z } from "zod";

export const uuidParamSchema = (paramName: string) =>
  z.object({
    [paramName]: z.string().uuid(`${paramName} phải là UUID hợp lệ`),
  });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
