import { NextFunction, Request, Response } from "express";

/**
 * Middleware ví dụ minh họa cách viết middleware tùy chỉnh.
 * Log thời gian xử lý mỗi request.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`);
  });

  next();
}
