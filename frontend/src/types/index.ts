export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName?: string;
  role?: string | Role[];
  createdAt?: string;
}

export interface Role {
  roleId: string;
  roleName: string;
}

export interface IngredientUnit {
  unitId: string;
  unitName: string;
  symbol: string;
}

export interface IngredientDetail {
  ingredientId: string;
  ingredientName: string;
}

export interface RecipeIngredientItem {
  ingredient: IngredientDetail;
  unit?: IngredientUnit;
  quantity?: number;
  amount?: string;
}

export interface RecipeStepItem {
  stepId: string;
  stepNumber: number;
  description: string;
}

export interface Recipe {
  recipeId: string;
  recipeName: string;
  recipeImage?: string;
  recipeDescription?: string;
  khauPhan?: string;
  cookTime: number;
  difficulty?: string;
  ingredients?: RecipeIngredientItem[];
  steps?: RecipeStepItem[];
  matchPercentage?: number;
  matchedCount?: number;
  missingCount?: number;
  isFullyMatched?: boolean;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface SearchRecipeResponse {
  pagination: Pagination;
  items: Recipe[];
}

export interface AdminStats {
  totalRecipes: number;
  totalUsers: number;
  totalIngredients: number;
  totalCategories: number;
}

export function isAdminUser(user: any): boolean {
  if (!user || !user.role) return false;
  if (typeof user.role === "string") {
    return user.role.toUpperCase() === "ADMIN";
  }
  if (Array.isArray(user.role)) {
    return user.role.some((r: any) =>
      typeof r === "string"
        ? r.toUpperCase() === "ADMIN"
        : (r?.roleName || r?.name || "").toUpperCase() === "ADMIN"
    );
  }
  return false;
}
