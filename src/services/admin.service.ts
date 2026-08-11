import { prisma } from "../config/prisma";

function mapDifficulty(value: string) {
  switch (value) {
    case "0":
      return "EASY";
    case "1":
      return "MEDIUM";
    case "2":
      return "HARD";
    default:
      return "UNKNOWN";
  }
}

export const adminService = {
  /**
   * Thống kê tổng quan cho Admin Dashboard
   */
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

  /**
   * Danh sách Recipe cho Admin
   *
   * GET /api/admin/recipes?page=1&limit=10&q=
   */
  async getRecipes(page = 1, limit = 10, q = "") {
    // Đảm bảo page / limit hợp lệ
    page = Math.max(1, Number(page) || 1);
    limit = Math.max(1, Math.min(100, Number(limit) || 10));

    const skip = (page - 1) * limit;

    const keyword = q.trim();

    const where = keyword
      ? {
          recipeName: {
            contains: keyword,
            mode: "insensitive" as const,
          },
        }
      : {};

    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        skip,
        take: limit,

        orderBy: {
          createdAt: "desc",
        },

        select: {
          recipeId: true,
          recipeName: true,
          hinh_anh: true,
          cookTime: true,
          difficulty: true,
          createdAt: true,

          createdByUser: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),

      prisma.recipe.count({
        where,
      }),
    ]);

    return {
      data: recipes.map((recipe) => ({
        ...recipe,
        difficulty: mapDifficulty(recipe.difficulty),
      })),

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
