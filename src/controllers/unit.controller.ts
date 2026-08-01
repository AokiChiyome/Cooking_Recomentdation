import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { unitService } from "../services/unit.service";
import { ApiError } from "../utils/ApiError";

export const unitController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await unitService.list(req.query as any);
    res.json({ success: true, data: items, meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const unit = await unitService.getById(req.params.id);
    res.json({ success: true, data: unit });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const unit = await unitService.create(req.body, req.user.userId);
    res.status(201).json({ success: true, message: "Tạo đơn vị thành công", data: unit });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const unit = await unitService.update(req.params.id, req.body, req.user.userId);
    res.json({ success: true, message: "Cập nhật đơn vị thành công", data: unit });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await unitService.remove(req.params.id);
    res.json({ success: true, message: "Xoá đơn vị thành công" });
  }),
};
