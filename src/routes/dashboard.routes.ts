import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validateQuery } from "../middleware/validate.middleware";
import {
  dashboardLimitQuerySchema,
  dashboardTrendQuerySchema,
} from "../validators/dashboard.validator";

const router = Router();

// Toàn bộ API dashboard yêu cầu đăng nhập. Schema hiện chưa có cột role/is_admin
// nên tạm thời áp dụng cho mọi user đã đăng nhập — nếu cần giới hạn chỉ admin,
// bổ sung cột role vào bảng users rồi thêm middleware authorize("ADMIN").
router.use(authenticate);

// Gộp toàn bộ dữ liệu cho 1 lần load trang dashboard
router.get("/summary", dashboardController.summary);

router.get("/overview", dashboardController.overview);
router.get("/recipes-by-difficulty", dashboardController.recipesByDifficulty);
router.get(
  "/recipes-by-category",
  validateQuery(dashboardLimitQuerySchema),
  dashboardController.recipesByCategory,
);
router.get(
  "/top-ingredients",
  validateQuery(dashboardLimitQuerySchema),
  dashboardController.topIngredients,
);
router.get("/cook-time-distribution", dashboardController.cookTimeDistribution);
router.get(
  "/recipes-trend",
  validateQuery(dashboardTrendQuerySchema),
  dashboardController.recipesTrend,
);
router.get(
  "/users-trend",
  validateQuery(dashboardTrendQuerySchema),
  dashboardController.usersTrend,
);
router.get(
  "/recent-recipes",
  validateQuery(dashboardLimitQuerySchema),
  dashboardController.recentRecipes,
);
router.get(
  "/recent-users",
  validateQuery(dashboardLimitQuerySchema),
  dashboardController.recentUsers,
);

export default router;
