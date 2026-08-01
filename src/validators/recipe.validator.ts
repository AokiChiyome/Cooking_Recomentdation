import { z } from "zod";
import { paginationQuerySchema } from "./common.validator";

const stepSchema = z.object({
  stepNumber: z.number().int().positive(),
  description: z.string().min(1, "Nội dung bước không được để trống"),
});

const recipeIngredientSchema = z.object({
  ingredientId: z.string().uuid(),
  quantity: z.number().positive("Số lượng phải lớn hơn 0"),
  unitId: z.string().uuid().nullable().optional(),
});

export const createRecipeSchema = z.object({
  recipeName: z.string().min(1, "Tên công thức không được để trống"),
  recipeImage: z.string().url().nullable().optional(),
  recipeDescription: z.string().nullable().optional(),
  cookTime: z.number().int().nonnegative("Thời gian nấu phải >= 0"),
  difficulty: z.enum(["0", "1", "2", "3", "4", "5"]).optional().default("0"),
  steps: z.array(stepSchema).min(1, "Cần ít nhất 1 bước nấu ăn"),
  ingredients: z.array(recipeIngredientSchema).min(1, "Cần ít nhất 1 nguyên liệu"),
  categoryIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateRecipeSchema = z.object({
  recipeName: z.string().min(1).optional(),
  recipeImage: z.string().url().nullable().optional(),
  recipeDescription: z.string().nullable().optional(),
  cookTime: z.number().int().nonnegative().optional(),
  difficulty: z.enum(["0", "1", "2", "3", "4", "5"]).optional(),
  steps: z.array(stepSchema).min(1).optional(),
  ingredients: z.array(recipeIngredientSchema).min(1).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
});

export const listRecipeQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  difficulty: z.enum(["0", "1", "2", "3", "4", "5"]).optional(),
  maxCookTime: z.coerce.number().int().positive().optional(),
});

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
