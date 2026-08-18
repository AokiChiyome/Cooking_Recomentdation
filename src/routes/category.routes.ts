import { Router } from "express";
import { categoryController } from "../controllers/category.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate, validateParams, validateQuery } from "../middleware/validate.middleware";
import {
  createCategorySchema,
  listCategoryQuerySchema,
  updateCategorySchema,
} from "../validators/category.validator";
import { uuidParamSchema } from "../validators/common.validator";

const router = Router();
const idParamSchema = uuidParamSchema("id");

router.get("/", validateQuery(listCategoryQuerySchema), categoryController.list);
router.get("/:id", validateParams(idParamSchema), categoryController.getById);
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createCategorySchema),
  categoryController.create
);
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validateParams(idParamSchema),
  validate(updateCategorySchema),
  categoryController.update
);
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validateParams(idParamSchema),
  categoryController.remove
);

export default router;
