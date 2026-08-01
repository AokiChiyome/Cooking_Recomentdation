import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Không tìm thấy route: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  console.error("[Unhandled Error]", err);

  return res.status(500).json({
    success: false,
    message: "Lỗi hệ thống, vui lòng thử lại sau",
    ...(env.nodeEnv === "development" && {
      error: err instanceof Error ? err.message : String(err),
    }),
  });
}
