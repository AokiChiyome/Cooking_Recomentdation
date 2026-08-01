import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

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
        const details = err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        return next(ApiError.badRequest("Dữ liệu đầu vào không hợp lệ", details));
      }
      next(err);
    }
  };
}
