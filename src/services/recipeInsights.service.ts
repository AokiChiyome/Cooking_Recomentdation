import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";

async function findRecipeByName(recipeName: string) {
  const recipe = await prisma.recipe.findFirst({
    where: { recipeName },
    select: { recipeId: true, recipeName: true },
  });
  if (!recipe) {
    throw ApiError.notFound(`Không tìm thấy công thức có tên "${recipeName}"`);
  }
  return recipe;
}

async function getRecipesWithIngredientIds() {
  return prisma.recipe.findMany({
    select: {
      recipeId: true,
      recipeName: true,
      ingredients: { select: { ingredientId: true } },
    },
  });
}

export const recipeInsightsService = {
  // 1. Tìm món theo nguyên liệu
  // SELECT DISTINCT r.recipe_name FROM recipes r
  // JOIN recipe_ingredients ri ON r.recipe_id = ri.recipe_ingredient_id
  // JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
  // WHERE i.ingredient_name = :ingredientName
  async searchByIngredientName(ingredientName: string) {
    return prisma.recipe.findMany({
      where: {
        ingredients: { some: { ingredient: { ingredientName } } },
      },
      select: { recipeId: true, recipeName: true },
      distinct: ["recipeId"],
      orderBy: { recipeName: "asc" },
    });
  },

  // 2. Tìm món có nhiều nguyên liệu (sắp xếp giảm dần theo số lượng nguyên liệu)
  async mostIngredients(limit = 10) {
    const recipes = await prisma.recipe.findMany({
      take: limit,
      orderBy: { ingredients: { _count: "desc" } },
      select: {
        recipeId: true,
        recipeName: true,
        _count: { select: { ingredients: true } },
      },
    });
    return recipes.map((r: any) => ({
      recipeId: r.recipeId,
      recipeName: r.recipeName,
      ingredientCount: r._count.ingredients,
    }));
  },

  // 3. Liệt kê toàn bộ nguyên liệu của một món (tìm theo recipe_name)
  async ingredientsByRecipeName(recipeName: string) {
    const recipe = await findRecipeByName(recipeName);

    const rows = await prisma.recipeIngredient.findMany({
      where: { recipeIngredientId: recipe.recipeId },
      include: { ingredient: true, unit: true },
    });

    return {
      recipeId: recipe.recipeId,
      recipeName: recipe.recipeName,
      ingredients: rows.map((ri: any) => ({
        ingredientName: ri.ingredient.ingredientName,
        quantity: ri.quantity,
        unitName: ri.unit?.unitName ?? null,
      })),
    };
  },

  // 4. Người dùng đang có nguyên liệu gì -> đã có sẵn ở GET /api/user-ingredients

  // 5. Người dùng nấu được món nào (đủ toàn bộ nguyên liệu)
  async cookableRecipes(userId: string) {
    const [recipes, userIngredients] = await Promise.all([
      getRecipesWithIngredientIds(),
      prisma.userIngredient.findMany({ where: { userId }, select: { ingredientId: true } }),
    ]);

    const ownedIds = new Set(userIngredients.map((ui: any) => ui.ingredientId));

    return recipes
      .filter(
        (r: any) =>
          r.ingredients.length > 0 &&
          r.ingredients.every((i: any) => ownedIds.has(i.ingredientId))
      )
      .map((r: any) => ({ recipeId: r.recipeId, recipeName: r.recipeName }));
  },

  // 6. Người dùng còn thiếu nguyên liệu gì (cho một món cụ thể theo tên)
  async missingIngredientsForRecipe(recipeName: string, userId: string) {
    const recipe = await findRecipeByName(recipeName);

    const [required, userIngredients] = await Promise.all([
      prisma.recipeIngredient.findMany({
        where: { recipeIngredientId: recipe.recipeId },
        include: { ingredient: true },
      }),
      prisma.userIngredient.findMany({ where: { userId }, select: { ingredientId: true } }),
    ]);

    const ownedIds = new Set(userIngredients.map((ui: any) => ui.ingredientId));
    const missingIngredients = required
      .filter((ri: any) => !ownedIds.has(ri.ingredientId))
      .map((ri: any) => ri.ingredient.ingredientName);

    return { recipeId: recipe.recipeId, recipeName: recipe.recipeName, missingIngredients };
  },

  // 7. Tìm các món có thể nấu gần đủ (>= threshold% nguyên liệu có sẵn)
  async almostCookableRecipes(userId: string, thresholdPercent = 70) {
    const [recipes, userIngredients] = await Promise.all([
      getRecipesWithIngredientIds(),
      prisma.userIngredient.findMany({ where: { userId }, select: { ingredientId: true } }),
    ]);

    const ownedIds = new Set(userIngredients.map((ui: any) => ui.ingredientId));

    return recipes
      .filter((r: any) => r.ingredients.length > 0)
      .map((r: any) => {
        const haveCount = r.ingredients.filter((i: any) => ownedIds.has(i.ingredientId)).length;
        const totalCount = r.ingredients.length;
        return {
          recipeId: r.recipeId,
          recipeName: r.recipeName,
          haveCount,
          totalCount,
          percent: Math.round((haveCount / totalCount) * 1000) / 10, // làm tròn 1 chữ số thập phân
        };
      })
      .filter((r: any) => r.percent >= thresholdPercent)
      .sort((a: any, b: any) => b.percent - a.percent);
  },

  // 8. Tìm món có thời gian nấu ngắn nhất
  async quickestRecipes(limit = 10) {
    return prisma.recipe.findMany({
      take: limit,
      orderBy: { cookTime: "asc" },
      select: { recipeId: true, recipeName: true, cookTime: true },
    });
  },

  // 9. Tìm các món sử dụng đồng thời TẤT CẢ nguyên liệu trong danh sách tên truyền vào
  async searchByIngredientNames(names: string[]) {
    if (names.length === 0) return [];

    return prisma.recipe.findMany({
      where: {
        AND: names.map((name) => ({
          ingredients: { some: { ingredient: { ingredientName: name } } },
        })),
      },
      select: { recipeId: true, recipeName: true },
      orderBy: { recipeName: "asc" },
    });
  },
};
