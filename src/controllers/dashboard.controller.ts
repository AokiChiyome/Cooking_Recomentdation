import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { dashboardService } from "../services/dashboard.service";

export const dashboardController = {
  overview: asyncHandler(async (_req: Request, res: Response) => {
    const data = await dashboardService.getOverview();
    res.json({ success: true, data });
  }),

  recipesByDifficulty: asyncHandler(async (_req: Request, res: Response) => {
    const data = await dashboardService.recipesByDifficulty();
    res.json({ success: true, data });
  }),

  recipesByCategory: asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query as { limit?: number };
    const data = await dashboardService.recipesByCategory(limit ?? 10);
    res.json({ success: true, data });
  }),

  topIngredients: asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query as { limit?: number };
    const data = await dashboardService.topIngredients(limit ?? 10);
    res.json({ success: true, data });
  }),

  cookTimeDistribution: asyncHandler(async (_req: Request, res: Response) => {
    const data = await dashboardService.cookTimeDistribution();
    res.json({ success: true, data });
  }),

  recipesTrend: asyncHandler(async (req: Request, res: Response) => {
    const { days } = req.query as { days?: number };
    const data = await dashboardService.recipesTrend(days ?? 30);
    res.json({ success: true, data });
  }),

  usersTrend: asyncHandler(async (req: Request, res: Response) => {
    const { days } = req.query as { days?: number };
    const data = await dashboardService.usersTrend(days ?? 30);
    res.json({ success: true, data });
  }),

  recentRecipes: asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query as { limit?: number };
    const data = await dashboardService.recentRecipes(limit ?? 10);
    res.json({ success: true, data });
  }),

  recentUsers: asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query as { limit?: number };
    const data = await dashboardService.recentUsers(limit ?? 10);
    res.json({ success: true, data });
  }),

  // Gộp toàn bộ vào 1 lần gọi để trang dashboard load nhanh hơn (ít round-trip)
  summary: asyncHandler(async (_req: Request, res: Response) => {
    const [
      overview,
      recipesByDifficulty,
      recipesByCategory,
      topIngredients,
      cookTimeDistribution,
      recipesTrend,
      recentRecipes,
    ] = await Promise.all([
      dashboardService.getOverview(),
      dashboardService.recipesByDifficulty(),
      dashboardService.recipesByCategory(5),
      dashboardService.topIngredients(5),
      dashboardService.cookTimeDistribution(),
      dashboardService.recipesTrend(14),
      dashboardService.recentRecipes(5),
    ]);

    res.json({
      success: true,
      data: {
        overview,
        recipesByDifficulty,
        recipesByCategory,
        topIngredients,
        cookTimeDistribution,
        recipesTrend,
        recentRecipes,
      },
    });
  }),
};
