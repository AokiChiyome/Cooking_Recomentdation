export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: Role[];
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

  // Backend admin recipes
  hinh_anh?: string;
  cookTime: number;
  difficulty?: string;
  createdAt?: string;

  // Các field dùng ở những màn hình khác
  recipeDescription?: string;
  khauPhan?: string;
  ingredients?: RecipeIngredientItem[];
  steps?: RecipeStepItem[];

  matchPercentage?: number;
  matchedCount?: number;
  missingCount?: number;
  isFullyMatched?: boolean;

  // Người tạo recipe
  createdByUser?: {
    userId: string;
    firstName?: string;
    lastName?: string;
  };
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
