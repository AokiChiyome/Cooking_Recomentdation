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

// Ghi chú: bảng "users" trong schema hiện tại chưa có cột role/is_admin,
// nên middleware phân quyền theo role chưa được thêm ở đây. Nếu sau này
// bổ sung cột role (hoặc bảng permissions riêng), có thể viết thêm hàm
// authorize(...roles) tương tự authenticate ở trên để kiểm tra req.user.
