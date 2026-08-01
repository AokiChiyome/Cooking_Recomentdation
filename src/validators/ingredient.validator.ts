import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

export const createIngredientSchema = z.object({
  ingredientName: z.string().min(1, "Tên nguyên liệu không được để trống"),
  categoryIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateIngredientSchema = z.object({
  ingredientName: z.string().min(1).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
});

export const listIngredientQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
});

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;
export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;
