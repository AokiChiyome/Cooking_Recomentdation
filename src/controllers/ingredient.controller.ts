import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ingredientService } from "../services/ingredient.service";
import { ApiError } from "../utils/ApiError";

export const ingredientController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await ingredientService.list(req.query as any);
    res.json({ success: true, data: items, meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const ingredient = await ingredientService.getById(req.params.id);
    res.json({ success: true, data: ingredient });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const ingredient = await ingredientService.create(req.body, req.user.userId);
    res.status(201).json({ success: true, message: "Tạo nguyên liệu thành công", data: ingredient });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const ingredient = await ingredientService.update(req.params.id, req.body, req.user.userId);
    res.json({ success: true, message: "Cập nhật nguyên liệu thành công", data: ingredient });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await ingredientService.remove(req.params.id);
    res.json({ success: true, message: "Xoá nguyên liệu thành công" });
  }),

  getTopPopular: asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const items = await ingredientService.getTopPopular(limit);
    res.json({ success: true, data: items });
  }),
};
