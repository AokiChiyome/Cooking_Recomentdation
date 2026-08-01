import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

export const createRecipeCategorySchema = z.object({
  recipeCategoryName: z.string().min(1, "Tên danh mục không được để trống"),
  parentCategoryId: z.string().uuid().nullable().optional(),
});

export const updateRecipeCategorySchema = z.object({
  recipeCategoryName: z.string().min(1).optional(),
  parentCategoryId: z.string().uuid().nullable().optional(),
});

export const listRecipeCategoryQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  parentCategoryId: z.string().uuid().optional(),
});

export type CreateRecipeCategoryInput = z.infer<typeof createRecipeCategorySchema>;
export type UpdateRecipeCategoryInput = z.infer<typeof updateRecipeCategorySchema>;
