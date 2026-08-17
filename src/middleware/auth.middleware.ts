import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../utils/jwt";

/**
 * Middleware kiểm tra Bearer access token trong header Authorization.
 * Nếu hợp lệ, gắn payload vào req.user để controller phía sau sử dụng.
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Thiếu hoặc sai định dạng access token"));
  }

  const token = header.split(" ")[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    return next(ApiError.unauthorized("Access token không hợp lệ hoặc đã hết hạn"));
  }
}

export function authorize(...roles: string[]) {
  return function (req: Request, _res: Response, next: NextFunction) {
    if (!req.user) {
      return next(
        ApiError.unauthorized("Cần đăng nhập để truy cập tài nguyên này")
      );
    }

    const userRole = (req.user as any).userRole || "USER";
    if (!roles.includes(userRole)) {
      return next(
        ApiError.forbidden("Bạn không có quyền truy cập tài nguyên này")
      );
    }

    next();
  };
}
