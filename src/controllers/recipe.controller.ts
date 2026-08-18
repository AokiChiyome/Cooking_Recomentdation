import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { recipeService } from "../services/recipe.service";
import { ApiError } from "../utils/ApiError";

export const recipeController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await recipeService.list(req.query as any);
    res.json({ success: true, data: items, meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const recipe = await recipeService.getById(req.params.id);
    res.json({ success: true, data: recipe });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const recipe = await recipeService.create(req.body, req.user.userId);
    res.status(201).json({ success: true, message: "Tạo công thức thành công", data: recipe });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const recipe = await recipeService.update(req.params.id, req.body, req.user.userId);
    res.json({ success: true, message: "Cập nhật công thức thành công", data: recipe });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await recipeService.remove(req.params.id, req.user.userId);
    res.json({ success: true, message: "Xoá công thức thành công" });
  }),

  save: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await recipeService.saveRecipe(req.user.userId, req.params.id);
    res.json({ success: true, message: "Đã lưu công thức thành công" });
  }),

  unsave: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await recipeService.unsaveRecipe(req.user.userId, req.params.id);
    res.json({ success: true, message: "Đã xóa công thức khỏi danh sách đã lưu" });
  }),

  getSaved: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const saved = await recipeService.getSavedRecipes(req.user.userId);
    res.json({ success: true, data: saved });
  }),
};
