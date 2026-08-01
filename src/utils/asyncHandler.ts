import { NextFunction, Request, Response } from "express";

type AsyncFn = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/**
 * Bọc controller async để tự động chuyển lỗi (throw / reject)
 * vào middleware xử lý lỗi tập trung, tránh phải try/catch lặp lại.
 */
export const asyncHandler =
  (fn: AsyncFn) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
