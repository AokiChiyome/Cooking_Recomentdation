import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * Middleware kiểm tra Bearer access token.
 *
 * Nếu token hợp lệ:
 *   req.user = { userId }
 */
export function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
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
    return next(
      ApiError.unauthorized("Access token không hợp lệ hoặc đã hết hạn"),
    );
  }
}

/**
 * Middleware yêu cầu user phải có quyền ADMIN.
 *
 * Phải chạy SAU authenticate.
 */
export async function authorizeAdmin(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user?.userId) {
      return next(ApiError.unauthorized("Chưa xác thực người dùng"));
    }

    const user = await prisma.user.findUnique({
      where: {
        userId: req.user.userId,
      },
      select: {
        userId: true,
        role: true,
      },
    });

    if (!user) {
      return next(ApiError.unauthorized("Người dùng không tồn tại"));
    }

    if (!user.role.map((r) => r.roleName).includes("admin")) {
      return next(ApiError.forbidden("Bạn không có quyền Admin"));
    }

    next();
  } catch (error) {
    next(error);
  }
}
