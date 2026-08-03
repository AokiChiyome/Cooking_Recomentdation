// import { Request, Response } from "express";
// import { asyncHandler } from "../utils/asyncHandler";
// import { recipeCategoryService } from "../services/recipeCategory.service";
// import { ApiError } from "../utils/ApiError";

// export const recipeCategoryController = {
//   list: asyncHandler(async (req: Request, res: Response) => {
//     const { items, meta } = await recipeCategoryService.list(req.query as any);
//     res.json({ success: true, data: items, meta });
//   }),

//   getById: asyncHandler(async (req: Request, res: Response) => {
//     const category = await recipeCategoryService.getById(req.params.id);
//     res.json({ success: true, data: category });
//   }),

//   create: asyncHandler(async (req: Request, res: Response) => {
//     if (!req.user) throw ApiError.unauthorized();
//     const category = await recipeCategoryService.create(req.body, req.user.userId);
//     res.status(201).json({ success: true, message: "Tạo danh mục công thức thành công", data: category });
//   }),

//   update: asyncHandler(async (req: Request, res: Response) => {
//     if (!req.user) throw ApiError.unauthorized();
//     const category = await recipeCategoryService.update(req.params.id, req.body, req.user.userId);
//     res.json({ success: true, message: "Cập nhật danh mục công thức thành công", data: category });
//   }),

//   remove: asyncHandler(async (req: Request, res: Response) => {
//     await recipeCategoryService.remove(req.params.id);
//     res.json({ success: true, message: "Xoá danh mục công thức thành công" });
//   }),
// };

import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { recipeCategoryService } from "../services/recipeCategory.service";
import { ApiError } from "../utils/ApiError";

export const recipeCategoryController = {
  // Lấy tất cả category của một recipe
  list: asyncHandler(async (req: Request, res: Response) => {
    const items = await recipeCategoryService.list(req.params.recipeId);

    res.json({
      success: true,
      data: items,
    });
  }),

  // Gán category cho recipe
  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();

    const { categoryId } = req.body;

    const item = await recipeCategoryService.create(
      req.params.recipeId,
      categoryId,
      req.user.userId,
    );

    res.status(201).json({
      success: true,
      message: "Thêm danh mục cho công thức thành công",
      data: item,
    });
  }),

  // Bỏ category khỏi recipe
  remove: asyncHandler(async (req: Request, res: Response) => {
    await recipeCategoryService.remove(
      req.params.recipeId,
      req.params.categoryId,
    );

    res.json({
      success: true,
      message: "Xóa danh mục khỏi công thức thành công",
    });
  }),
};
