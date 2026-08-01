import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

export const createCategorySchema = z.object({
  ingredientCategoryName: z.string().min(1, "Tên danh mục không được để trống"),
  parentCategoryId: z.string().uuid().nullable().optional(),
});

export const updateCategorySchema = z.object({
  ingredientCategoryName: z.string().min(1).optional(),
  parentCategoryId: z.string().uuid().nullable().optional(),
});

export const listCategoryQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  parentCategoryId: z.string().uuid().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
