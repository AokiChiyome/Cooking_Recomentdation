import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { recipeCategoryService } from "../services/recipeCategory.service";
import { ApiError } from "../utils/ApiError";

export const recipeCategoryController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await recipeCategoryService.list(req.query as any);
    res.json({ success: true, data: items, meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const category = await recipeCategoryService.getById(req.params.id);
    res.json({ success: true, data: category });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const category = await recipeCategoryService.create(req.body, req.user.userId);
    res.status(201).json({ success: true, message: "Tạo danh mục công thức thành công", data: category });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const category = await recipeCategoryService.update(req.params.id, req.body, req.user.userId);
    res.json({ success: true, message: "Cập nhật danh mục công thức thành công", data: category });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await recipeCategoryService.remove(req.params.id);
    res.json({ success: true, message: "Xoá danh mục công thức thành công" });
  }),
};
