// types/dashboardStats.ts
// Kiểu dữ liệu cho response của /api/dashboard/*

export interface DashboardOverview {
  totalRecipes: number;
  totalIngredients: number;
  totalUsers: number;
  totalCategories: number;
  totalUnits: number;
  avgCookTimeMinutes: number;
}

export interface RecipesByDifficultyItem {
  difficulty: string;
  count: number;
}

export interface RecipesByCategoryItem {
  recipeCategoryId: string;
  recipeCategoryName: string;
  recipeCount: number;
}

export interface TopIngredientItem {
  ingredientId: string;
  ingredientName: string;
  usedInRecipeCount: number;
}

export interface CookTimeDistributionItem {
  label: string;
  count: number;
}

export interface TrendPoint {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface RecipeAuthor {
  firstName: string;
  lastName: string;
}

export interface RecentRecipeItem {
  recipeId: string;
  recipeName: string;
  createdByUser: RecipeAuthor;
}

export interface RecentUserItem {
  userId: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface DashboardSummary {
  overview: DashboardOverview;
  recipesByDifficulty: RecipesByDifficultyItem[];
  recipesByCategory: RecipesByCategoryItem[];
  topIngredients: TopIngredientItem[];
  cookTimeDistribution: CookTimeDistributionItem[];
  recipesTrend: TrendPoint[];
  usersTrend: TrendPoint[];
  recentRecipes: RecentRecipeItem[];
  recentUsers: RecentUserItem[];
}
