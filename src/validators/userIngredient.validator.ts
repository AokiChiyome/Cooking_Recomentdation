import { z } from "zod";

export const upsertUserIngredientSchema = z.object({
  ingredientId: z.string().uuid(),
  quantity: z.number().positive().nullable().optional(),
  unitId: z.string().uuid().nullable().optional(),
});

export const updateUserIngredientSchema = z.object({
  quantity: z.number().positive().nullable().optional(),
  unitId: z.string().uuid().nullable().optional(),
});

export type UpsertUserIngredientInput = z.infer<typeof upsertUserIngredientSchema>;
export type UpdateUserIngredientInput = z.infer<typeof updateUserIngredientSchema>;
