import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { userIngredientService } from "../services/userIngredient.service";
import { ApiError } from "../utils/ApiError";

export const userIngredientController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const items = await userIngredientService.listForUser(req.user.userId);
    res.json({ success: true, data: items });
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const item = await userIngredientService.getOne(req.user.userId, req.params.ingredientId);
    res.json({ success: true, data: item });
  }),

  add: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const item = await userIngredientService.add(req.user.userId, req.body);
    res.status(201).json({ success: true, message: "Thêm nguyên liệu vào kho thành công", data: item });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const item = await userIngredientService.update(
      req.user.userId,
      req.params.ingredientId,
      req.body
    );
    res.json({ success: true, message: "Cập nhật kho nguyên liệu thành công", data: item });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await userIngredientService.remove(req.user.userId, req.params.ingredientId);
    res.json({ success: true, message: "Xoá nguyên liệu khỏi kho thành công" });
  }),
};
