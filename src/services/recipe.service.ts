import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { buildMeta, getPagination } from "../utils/pagination";
import {
  CreateRecipeInput,
  UpdateRecipeInput,
} from "../validators/recipe.validator";

interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  difficulty?: string;
  maxCookTime?: number;
}

const recipeDetailInclude = {
  steps: { orderBy: { stepNumber: "asc" as const } },
  ingredients: { include: { ingredient: true, unit: true } },
  recipeCategories: { include: { category: true } },
} satisfies Prisma.RecipeInclude;

function formatRecipe(recipe: any) {
  const { recipeCategories, ingredients, ...rest } = recipe;
  return {
    ...rest,
    ingredients: ingredients?.map((ri: any) => ({
      ingredientId: ri.ingredientId,
      ingredientName: ri.ingredient?.ingredientName,
      quantity: ri.quantity,
      unit: ri.unit,
    })),
    categories: recipeCategories?.map((rc: any) => rc.category) ?? [],
  };
}

async function ensureIngredientsExist(
  tx: Prisma.TransactionClient,
  ingredientIds: string[],
) {
  const count = await tx.ingredient.count({
    where: { ingredientId: { in: ingredientIds } },
  });
  if (count !== ingredientIds.length) {
    throw ApiError.badRequest(
      "Một hoặc nhiều ingredientId trong danh sách nguyên liệu không tồn tại",
    );
  }
}

async function ensureCategoriesExist(
  tx: Prisma.TransactionClient,
  categoryIds: string[],
) {
  if (categoryIds.length === 0) return;
  const count = await tx.recipeCategory.count({
    where: { categoryId: { in: categoryIds } },
  });
  if (count !== categoryIds.length) {
    throw ApiError.badRequest("Một hoặc nhiều categoryIds không tồn tại");
  }
}

async function ensureUnitsExist(
  tx: Prisma.TransactionClient,
  unitIds: string[],
) {
  if (unitIds.length === 0) return;
  const count = await tx.unit.count({ where: { unitId: { in: unitIds } } });
  if (count !== unitIds.length) {
    throw ApiError.badRequest("Một hoặc nhiều unitId không tồn tại");
  }
}

export const recipeService = {
  async list(query: ListQuery) {
    const { skip, take, page, limit } = getPagination(query);

    const where: Prisma.RecipeWhereInput = {
      ...(query.search && {
        recipeName: { contains: query.search, mode: "insensitive" },
      }),
      ...(query.difficulty && { difficulty: query.difficulty }),
      ...(query.maxCookTime && { cookTime: { lte: query.maxCookTime } }),
      ...(query.categoryId && {
        recipeCategories: { some: { categoryId: query.categoryId } },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          recipeCategories: { include: { category: true } },
        },
      }),
      prisma.recipe.count({ where }),
    ]);

    const formatted = items.map((r: any) => ({
      recipeId: r.recipeId,
      recipeName: r.recipeName,
      recipeImage: r.recipeImage,
      cookTime: r.cookTime,
      difficulty: r.difficulty,
      categories: r.recipeCategories.map((rc: any) => rc.category),
      createdAt: r.createdAt,
    }));

    return { items: formatted, meta: buildMeta(total, page, limit) };
  },

  async getById(id: string) {
    const recipe = await prisma.recipe.findUnique({
      where: { recipeId: id },
      include: recipeDetailInclude,
    });
    if (!recipe) throw ApiError.notFound("Không tìm thấy công thức nấu ăn");
    return formatRecipe(recipe);
  },

  async create(input: CreateRecipeInput, userId: string) {
    const result = await prisma.$transaction(async (tx) => {
      const ingredientIds = input.ingredients.map((i) => i.ingredientId);
      const unitIds = input.ingredients
        .map((i) => i.unitId)
        .filter((v): v is string => !!v);

      await ensureIngredientsExist(tx, ingredientIds);
      await ensureUnitsExist(tx, unitIds);
      await ensureCategoriesExist(tx, input.categoryIds ?? []);

      const recipe = await tx.recipe.create({
        data: {
          recipeName: input.recipeName,
          recipeImage: input.recipeImage ?? null,
          recipeDescription: input.recipeDescription ?? null,
          cookTime: input.cookTime,
          difficulty: input.difficulty ?? "0",
          createdBy: userId,
          updatedBy: userId,
        },
      });

      await tx.recipeStep.createMany({
        data: input.steps.map((s) => ({
          recipeId: recipe.recipeId,
          stepNumber: s.stepNumber,
          description: s.description,
        })),
      });

      await tx.recipeIngredient.createMany({
        data: input.ingredients.map((i) => ({
          recipeId: recipe.recipeId,
          ingredientId: i.ingredientId,
          quantity: i.quantity,
          unitId: i.unitId ?? null,
        })),
      });

      if (input.categoryIds && input.categoryIds.length > 0) {
        await tx.recipeCategory.createMany({
          data: input.categoryIds.map((categoryId) => ({
            recipeId: recipe.recipeId,
            categoryId: categoryId,
            createdBy: userId,
          })),
        });
      }

      return tx.recipe.findUniqueOrThrow({
        where: { recipeId: recipe.recipeId },
        include: recipeDetailInclude,
      });
    });

    return formatRecipe(result);
  },

  async update(id: string, input: UpdateRecipeInput, userId: string) {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.recipe.findUnique({ where: { recipeId: id } });
      if (!existing) throw ApiError.notFound("Không tìm thấy công thức nấu ăn");

      if (input.ingredients) {
        const ingredientIds = input.ingredients.map((i) => i.ingredientId);
        const unitIds = input.ingredients
          .map((i) => i.unitId)
          .filter((v): v is string => !!v);
        await ensureIngredientsExist(tx, ingredientIds);
        await ensureUnitsExist(tx, unitIds);
      }
      if (input.categoryIds) {
        await ensureCategoriesExist(tx, input.categoryIds);
      }

      await tx.recipe.update({
        where: { recipeId: id },
        data: {
          ...(input.recipeName !== undefined && {
            recipeName: input.recipeName,
          }),
          ...(input.recipeImage !== undefined && {
            recipeImage: input.recipeImage,
          }),
          ...(input.recipeDescription !== undefined && {
            recipeDescription: input.recipeDescription,
          }),
          ...(input.cookTime !== undefined && { cookTime: input.cookTime }),
          ...(input.difficulty !== undefined && {
            difficulty: input.difficulty,
          }),
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });

      // Thay toàn bộ danh sách bước nấu nếu có gửi lên
      if (input.steps) {
        await tx.recipeStep.deleteMany({ where: { recipeId: id } });
        await tx.recipeStep.createMany({
          data: input.steps.map((s) => ({
            recipeId: id,
            stepNumber: s.stepNumber,
            description: s.description,
          })),
        });
      }

      // Thay toàn bộ danh sách nguyên liệu nếu có gửi lên
      if (input.ingredients) {
        await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
        await tx.recipeIngredient.createMany({
          data: input.ingredients.map((i) => ({
            recipeId: id,
            ingredientId: i.ingredientId,
            quantity: i.quantity,
            unitId: i.unitId ?? null,
          })),
        });
      }

      // Thay toàn bộ danh sách danh mục nếu có gửi lên
      if (input.categoryIds) {
        await tx.recipeCategory.deleteMany({ where: { recipeId: id } });
        if (input.categoryIds.length > 0) {
          await tx.recipeCategory.createMany({
            data: input.categoryIds.map((categoryId) => ({
              recipeId: id,
              categoryId: categoryId,
              createdBy: userId,
            })),
          });
        }
      }

      return tx.recipe.findUniqueOrThrow({
        where: { recipeId: id },
        include: recipeDetailInclude,
      });
    });

    return formatRecipe(result);
  },

  async remove(id: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.recipe.findUnique({ where: { recipeId: id } });
      if (!existing) throw ApiError.notFound("Không tìm thấy công thức nấu ăn");

      // Xoá tường minh theo thứ tự để đảm bảo tính nhất quán trong transaction
      // (dù các FK liên quan đã có onDelete: Cascade sẵn).
      await tx.recipeCategory.deleteMany({ where: { recipeId: id } });
      await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
      await tx.recipeStep.deleteMany({ where: { recipeId: id } });
      await tx.recipe.delete({ where: { recipeId: id } });

      return { id };
    });
  },
};
