import { Router } from "express";
import { categoryController } from "../controllers/category.controller";
import { authenticate } from "../middleware/auth.middleware";
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
router.post("/", authenticate, validate(createCategorySchema), categoryController.create);
router.put(
  "/:id",
  authenticate,
  validateParams(idParamSchema),
  validate(updateCategorySchema),
  categoryController.update
);
router.delete("/:id", authenticate, validateParams(idParamSchema), categoryController.remove);

export default router;
