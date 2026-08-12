import { prisma } from "../config/prisma";
import { buildMeta } from "../utils/pagination";

export const adminService = {
  async getStats() {
    const [
      totalRecipes,
      totalUsers,
      totalIngredients,
      totalCategories,
      totalUnits,
      avgCookTime,
    ] = await Promise.all([
      prisma.recipe.count(),
      prisma.user.count(),
      prisma.ingredient.count(),
      prisma.category.count(),
      prisma.unit.count(),
      prisma.recipe.aggregate({
        _avg: {
          cookTime: true,
        },
      }),
    ]);

    return {
      totalRecipes,
      totalUsers,
      totalIngredients,
      totalCategories,
      totalUnits,
      avgCookTimeMinutes: avgCookTime._avg.cookTime
        ? Math.round(avgCookTime._avg.cookTime)
        : 0,
    };
  },

  async getRecipes(page = 1, limit = 10, q = "") {
    const skip = (page - 1) * limit;
    const take = limit;

    const where = q
      ? {
          recipeName: {
            contains: q,
            mode: "insensitive" as const,
          },
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          createdByUser: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
            },
          },
          ingredients: {
            include: {
              ingredient: true,
              unit: true,
            },
          },
          steps: {
            orderBy: { stepNumber: "asc" },
          },
        },
      }),
      prisma.recipe.count({ where }),
    ]);

    const formatted = items.map((r: any) => ({
      recipeId: r.recipeId,
      recipeName: r.recipeName,
      recipeDescription: r.recipeDescription,
      hinh_anh: r.hinh_anh,
      recipeImage: r.hinh_anh,
      cookTime: r.cookTime,
      khauPhan: r.khau_phan || r.khauPhan || "2 người",
      difficulty: r.difficulty || "0",
      createdByUser: r.createdByUser
        ? `${r.createdByUser.firstName} ${r.createdByUser.lastName || ""}`.trim()
        : "Hệ thống",
      ingredientsCount: r.ingredients ? r.ingredients.length : 0,
      stepsCount: r.steps ? r.steps.length : 0,
      ingredients: r.ingredients ? r.ingredients.map((ri: any) => ({
        ingredientId: ri.ingredientId,
        ingredientName: ri.ingredient?.ingredientName,
        quantity: ri.quantity,
        unit: ri.unit,
      })) : [],
      steps: r.steps ? r.steps.map((s: any) => ({
        stepId: s.stepId,
        stepNumber: s.stepNumber,
        description: s.description,
      })) : [],
      createdAt: r.createdAt,
    }));

    return {
      items: formatted,
      pagination: buildMeta(total, page, limit),
    };
  },

  async createRecipe(input: any) {
    const recipe = await prisma.recipe.create({
      data: {
        recipeName: input.recipeName,
        cookTime: input.cookTime || 15,
        khau_phan: input.khauPhan || "2 người",
        hinh_anh: input.recipeImage || input.hinh_anh || "",
        recipeDescription: input.recipeDescription || "",
        difficulty: input.difficulty || "0",
      },
    });

    // Create steps if provided
    if (Array.isArray(input.steps) && input.steps.length > 0) {
      await prisma.recipeStep.createMany({
        data: input.steps.map((s: string | any, idx: number) => ({
          recipeId: recipe.recipeId,
          stepNumber: idx + 1,
          description: typeof s === "string" ? s : s.description || "",
        })),
      });
    }

    return recipe;
  },

  async deleteRecipe(id: string) {
    // Delete relations first for cascade safety
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: id } });
    await prisma.recipeStep.deleteMany({ where: { recipeId: id } });
    await prisma.recipeCategory.deleteMany({ where: { recipeId: id } });
    await prisma.userRecipe.deleteMany({ where: { recipeId: id } });

    return prisma.recipe.delete({
      where: { recipeId: id },
    });
  },
};
