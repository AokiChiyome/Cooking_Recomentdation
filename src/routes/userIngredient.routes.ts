import { Router } from "express";
import { userIngredientController } from "../controllers/userIngredient.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate, validateParams } from "../middleware/validate.middleware";
import {
  updateUserIngredientSchema,
  upsertUserIngredientSchema,
} from "../validators/userIngredient.validator";
import { uuidParamSchema } from "../validators/common.validator";

const router = Router();
const ingredientIdParamSchema = uuidParamSchema("ingredientId");

// Toàn bộ endpoint đều cần đăng nhập vì dữ liệu gắn với user hiện tại (req.user.userId)
router.use(authenticate);

router.get("/", userIngredientController.list);
router.post("/by-name", userIngredientController.addByName);
router.delete("/by-name", userIngredientController.removeByName);
router.delete("/clear-all", userIngredientController.clearAll);

router.get(
  "/:ingredientId",
  validateParams(ingredientIdParamSchema),
  userIngredientController.getOne
);
router.post("/", validate(upsertUserIngredientSchema), userIngredientController.add);
router.put(
  "/:ingredientId",
  validateParams(ingredientIdParamSchema),
  validate(updateUserIngredientSchema),
  userIngredientController.update
);
router.delete(
  "/:ingredientId",
  validateParams(ingredientIdParamSchema),
  userIngredientController.remove
);

export default router;
