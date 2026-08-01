import { z } from "zod";

export const searchByIngredientQuerySchema = z.object({
  ingredientName: z.string().min(1, "Thiếu query param ingredientName"),
});

export const listLimitQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// names dạng "Thit bo,Hanh tay" -> tách thành mảng
export const searchByIngredientsQuerySchema = z.object({
  names: z
    .string()
    .min(1, "Thiếu query param names")
    .transform((val) =>
      val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    ),
});

export const almostCookableQuerySchema = z.object({
  threshold: z.coerce.number().min(0).max(100).optional(),
});

export const recipeNameParamSchema = z.object({
  name: z.string().min(1, "Thiếu tên công thức"),
});
