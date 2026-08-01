import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

function formatZodError(err: ZodError) {
  return err.errors.map((e) => ({
    field: e.path.join("."),
    message: e.message,
  }));
}

/**
 * Middleware validate req.body theo zod schema truyền vào.
 * Nếu lỗi -> trả 400 kèm chi tiết field lỗi.
 */
export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(
          ApiError.badRequest("Dữ liệu đầu vào không hợp lệ", formatZodError(err))
        );
      }
      next(err);
    }
  };
}

/**
 * Middleware validate req.query (dùng cho các API GET có filter/pagination).
 * Kết quả sau khi parse (đã ép kiểu number/boolean...) được gán đè lại vào req.query.
 */
export function validateQuery(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(
          ApiError.badRequest("Query params không hợp lệ", formatZodError(err))
        );
      }
      next(err);
    }
  };
}

/**
 * Middleware validate req.params (ví dụ kiểm tra :id có đúng định dạng UUID).
 */
export function validateParams(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(
          ApiError.badRequest("URL params không hợp lệ", formatZodError(err))
        );
      }
      next(err);
    }
  };
}
