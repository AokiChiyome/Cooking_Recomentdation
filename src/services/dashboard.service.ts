import { prisma } from "../config/prisma";

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Gom danh sách timestamp thành các bucket theo ngày, đủ N ngày gần nhất
 * (kể cả ngày không có dữ liệu = 0), dùng cho biểu đồ trend.
 */
function bucketByDay(timestamps: Date[], days: number) {
  const since = startOfDay(new Date());
  since.setDate(since.getDate() - (days - 1));

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    buckets.set(toDateKey(d), 0);
  }

  for (const ts of timestamps) {
    const key = toDateKey(ts);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) as number) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({
    date,
    count,
  }));
}

const COOK_TIME_BUCKETS = [
  { label: "0-30 phút", min: 0, max: 30 },
  { label: "31-60 phút", min: 31, max: 60 },
  { label: "61-120 phút", min: 61, max: 120 },
  { label: "Trên 120 phút", min: 121, max: Infinity },
];

export const dashboardService = {
  // Số liệu tổng quan hiển thị dạng "card" trên dashboard
  async getOverview() {
    const [
      totalRecipes,
      totalCategories,
      totalIngredients,
      totalUsers,
      totalIngredientCategories,
      totalRecipeCategories,
      totalUnits,
      avgCookTime,
    ] = await Promise.all([
      prisma.recipe.count(),
      prisma.category.count(),
      prisma.ingredient.count(),
      prisma.user.count(),
      prisma.category.count(),
      prisma.recipeCategory.count(),
      prisma.unit.count(),
      prisma.recipe.aggregate({ _avg: { cookTime: true } }),
    ]);

    return {
      totalRecipes,
      totalCategories,
      totalIngredients,
      totalUsers,
      totalIngredientCategories,
      totalRecipeCategories,
      totalUnits,
      avgCookTimeMinutes: avgCookTime._avg.cookTime
        ? Math.round(avgCookTime._avg.cookTime)
        : 0,
    };
  },

  // Số lượng công thức theo từng mức độ khó (cho pie/bar chart)
  async recipesByDifficulty() {
    const rows = await prisma.recipe.groupBy({
      by: ["difficulty"],
      _count: { _all: true },
      orderBy: { difficulty: "asc" },
    });

    return rows.map((r: any) => ({
      difficulty: r.difficulty,
      count: r._count._all,
    }));
  },

  // Top N danh mục công thức có nhiều recipe nhất
  async recipesByCategory(limit = 10) {
    const grouped = await prisma.recipeCategory.groupBy({
      by: ["categoryId"],
      _count: {
        recipeId: true,
      },
      orderBy: {
        _count: {
          recipeId: "desc",
        },
      },
      take: limit,
    });

    if (grouped.length === 0) return [];

    const categories = await prisma.category.findMany({
      where: {
        categoryId: {
          in: grouped.map((g) => g.categoryId),
        },
      },
      select: {
        categoryId: true,
        categoryName: true,
      },
    });

    const nameMap = new Map(
      categories.map((c) => [c.categoryId, c.categoryName]),
    );

    return grouped.map((g) => ({
      categoryId: g.categoryId,
      categoryName: nameMap.get(g.categoryId) ?? "N/A",
      recipeCount: g._count.recipeId,
    }));
  },

  // Top N nguyên liệu được dùng trong nhiều công thức nhất
  async topIngredients(limit = 10) {
    const grouped = await prisma.recipeIngredient.groupBy({
      by: ["ingredientId"],
      _count: { _all: true },
      orderBy: { _count: { ingredientId: "desc" } },
      take: limit,
    });

    if (grouped.length === 0) return [];

    const ingredients = await prisma.ingredient.findMany({
      where: { ingredientId: { in: grouped.map((g: any) => g.ingredientId) } },
      select: { ingredientId: true, ingredientName: true },
    });
    const nameMap = new Map(
      ingredients.map((i: any) => [i.ingredientId, i.ingredientName]),
    );

    return grouped.map((g: any) => ({
      ingredientId: g.ingredientId,
      ingredientName: nameMap.get(g.ingredientId) ?? "N/A",
      usedInRecipeCount: g._count._all,
    }));
  },

  // Phân bố công thức theo khoảng thời gian nấu (cho bar chart)
  async cookTimeDistribution() {
    const recipes = await prisma.recipe.findMany({
      select: { cookTime: true },
    });

    return COOK_TIME_BUCKETS.map((bucket) => ({
      label: bucket.label,
      count: recipes.filter(
        (r: any) => r.cookTime >= bucket.min && r.cookTime <= bucket.max,
      ).length,
    }));
  },

  // Số công thức được tạo mới theo từng ngày, N ngày gần nhất (line chart)
  async recipesTrend(days = 30) {
    const since = startOfDay(new Date());
    since.setDate(since.getDate() - (days - 1));

    const recipes = await prisma.recipe.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });

    return bucketByDay(
      recipes.map((r: any) => r.createdAt),
      days,
    );
  },

  // Số user đăng ký mới theo từng ngày, N ngày gần nhất (line chart)
  async usersTrend(days = 30) {
    const since = startOfDay(new Date());
    since.setDate(since.getDate() - (days - 1));

    const users = await prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });

    return bucketByDay(
      users.map((u: any) => u.createdAt),
      days,
    );
  },

  // Danh sách công thức mới tạo gần đây (bảng "Recent activity")
  async recentRecipes(limit = 10) {
    return prisma.recipe.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        recipeId: true,
        recipeName: true,
        recipeImage: true,
        cookTime: true,
        difficulty: true,
        createdAt: true,
        createdByUser: {
          select: { userId: true, firstName: true, lastName: true },
        },
      },
    });
  },

  // Danh sách user mới đăng ký gần đây
  async recentUsers(limit = 10) {
    return prisma.user.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
      },
    });
  },
};
