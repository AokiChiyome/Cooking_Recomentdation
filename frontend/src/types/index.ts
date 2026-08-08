export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: 'USER' | 'ADMIN';
  createdAt?: string;
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
