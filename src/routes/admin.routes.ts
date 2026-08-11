import { Router, Request, Response, NextFunction } from "express";
import { authenticate, authorizeAdmin } from "../middleware/auth.middleware";
import { adminService } from "../services/admin.service";

const router = Router();

router.use(authenticate);
router.use(authorizeAdmin);

/**
 * GET /api/admin/stats
 * Thống kê tổng quan Admin Dashboard
 */
router.get(
  "/stats",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await adminService.getStats();

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/admin/recipes?page=1&limit=10&q=
 * Danh sách recipes có pagination + search
 */
router.get(
  "/recipes",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 10);
      const q = String(req.query.q ?? "");

      const result = await adminService.getRecipes(page, limit, q);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
