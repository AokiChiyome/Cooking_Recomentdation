import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "test",
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: "Quá nhiều yêu cầu, vui lòng thử lại sau",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "test",
});

export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: "Quá nhiều lần tìm kiếm, vui lòng thử lại sau",
  standardHeaders: true,
  legacyHeaders: false,
});
