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

export interface Category {
  categoryId: string;
  categoryName: string;
  category_type?: string;
  parentCategoryId?: string;
  parent?: Category | null;
  recipeCount?: number;
}

export interface Unit {
  unitId: string;
  unitName: string;
  symbol: string;
}

export interface Ingredient {
  ingredientId: string;
  ingredientName: string;
  recipeCount?: number;
}

export interface IngredientUnit {
  unitId: string;
  unitName: string;
  symbol: string;
}

export interface RecipeIngredientItem {
  ingredientId: string;
  ingredientName: string;
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
  if (!user) return false;

  // Check userRole field (new approach)
  if (user.userRole && user.userRole.toUpperCase() === "ADMIN") {
    return true;
  }

  // Check role array (legacy approach)
  if (!user.role) return false;
  if (typeof user.role === "string") {
    return user.role.toUpperCase() === "ADMIN";
  }
  if (Array.isArray(user.role)) {
    return user.role.some((r: any) =>
      typeof r === "string"
        ? r.toUpperCase() === "ADMIN"
        : (r?.roleName || r?.name || "").toUpperCase() === "ADMIN",
    );
  }
  return false;
}
