import { Router } from "express";
import { recipeCategoryController } from "../controllers/recipeCategory.controller";
import { authenticate } from "../middleware/auth.middleware";
import {
  validate,
  validateParams,
  validateQuery,
} from "../middleware/validate.middleware";
import {
  createRecipeCategorySchema,
  listRecipeCategoryQuerySchema,
  updateRecipeCategorySchema,
} from "../validators/recipeCategory.validator";
import { uuidParamSchema } from "../validators/common.validator";

const router = Router();
const idParamSchema = uuidParamSchema("id");

router.get(
  "/",
  validateQuery(listRecipeCategoryQuerySchema),
  recipeCategoryController.list,
);
// router.get("/:id", validateParams(idParamSchema), recipeCategoryController.getById);
router.post(
  "/",
  authenticate,
  validate(createRecipeCategorySchema),
  recipeCategoryController.create,
);
// router.put(
//   "/:id",
//   authenticate,
//   validateParams(idParamSchema),
//   validate(updateRecipeCategorySchema),
//   recipeCategoryController.update
// );
router.delete(
  "/:id",
  authenticate,
  validateParams(idParamSchema),
  recipeCategoryController.remove,
);

export default router;
