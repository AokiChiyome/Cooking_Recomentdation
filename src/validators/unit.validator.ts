import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

export const createUnitSchema = z.object({
  unitName: z.string().min(1, "Tên đơn vị không được để trống"),
  symbol: z.string().min(1, "Ký hiệu không được để trống"),
});

export const updateUnitSchema = z.object({
  unitName: z.string().min(1).optional(),
  symbol: z.string().min(1).optional(),
});

export const listUnitQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
