import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { recipeInsightsService } from "../services/recipeInsights.service";
import { ApiError } from "../utils/ApiError";

export const recipeInsightsController = {
  // 1. GET /api/recipes/search-by-ingredient?ingredientName=Ca chua
  searchByIngredient: asyncHandler(async (req: Request, res: Response) => {
    const { ingredientName } = req.query as { ingredientName: string };
    const data = await recipeInsightsService.searchByIngredientName(ingredientName);
    res.json({ success: true, data });
  }),

  // 2. GET /api/recipes/most-ingredients?limit=10
  mostIngredients: asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query as { limit?: number };
    const data = await recipeInsightsService.mostIngredients(limit ?? 10);
    res.json({ success: true, data });
  }),

  // 3. GET /api/recipes/by-name/:name/ingredients
  ingredientsByRecipeName: asyncHandler(async (req: Request, res: Response) => {
    const data = await recipeInsightsService.ingredientsByRecipeName(req.params.name);
    res.json({ success: true, data });
  }),

  // 5. GET /api/recipes/cookable (cần đăng nhập, dùng kho nguyên liệu của user hiện tại)
  cookable: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await recipeInsightsService.cookableRecipes(req.user.userId);
    res.json({ success: true, data });
  }),

  // 6. GET /api/recipes/by-name/:name/missing-ingredients (cần đăng nhập)
  missingIngredients: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await recipeInsightsService.missingIngredientsForRecipe(
      req.params.name,
      req.user.userId
    );
    res.json({ success: true, data });
  }),

  // 7. GET /api/recipes/almost-cookable?threshold=70 (cần đăng nhập)
  almostCookable: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { threshold } = req.query as { threshold?: number };
    const data = await recipeInsightsService.almostCookableRecipes(
      req.user.userId,
      threshold ?? 70
    );
    res.json({ success: true, data });
  }),

  // 8. GET /api/recipes/quickest?limit=10
  quickest: asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query as { limit?: number };
    const data = await recipeInsightsService.quickestRecipes(limit ?? 10);
    res.json({ success: true, data });
  }),

  // 9. GET /api/recipes/search-by-ingredients?names=Thit bo,Hanh tay
  searchByIngredients: asyncHandler(async (req: Request, res: Response) => {
    const { names } = req.query as unknown as { names: string[] };
    const data = await recipeInsightsService.searchByIngredientNames(names);
    res.json({ success: true, data });
  }),
};
