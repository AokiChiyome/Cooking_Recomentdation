import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { adminService } from "../services/admin.service";

export const adminController = {
  getStats: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.getStats();
    res.json({ success: true, data });
  }),

  getRecipes: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const q = (req.query.q as string) || "";

    const data = await adminService.getRecipes(page, limit, q);
    res.json({ success: true, data });
  }),

  createRecipe: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.createRecipe(req.body, req.user!.userId);
    res
      .status(201)
      .json({ success: true, message: "Thêm món ăn thành công", data });
  }),

  deleteRecipe: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await adminService.deleteRecipe(id);
    res.json({ success: true, message: "Xóa món ăn thành công" });
  }),

  updateRecipe: asyncHandler(async (req: Request, res: Response) => {
    const recipe = await adminService.updateRecipe(
      req.params.id,
      req.body,
      req.user!.userId,
    );

    return res.json({
      success: true,
      data: recipe,
    });
  }),
};
