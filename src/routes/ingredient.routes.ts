import { Router } from "express";
import { ingredientController } from "../controllers/ingredient.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate, validateParams, validateQuery } from "../middleware/validate.middleware";
import {
  createIngredientSchema,
  listIngredientQuerySchema,
  updateIngredientSchema,
} from "../validators/ingredient.validator";
import { uuidParamSchema } from "../validators/common.validator";

const router = Router();
const idParamSchema = uuidParamSchema("id");

router.get("/top-popular", ingredientController.getTopPopular);
router.get("/", validateQuery(listIngredientQuerySchema), ingredientController.list);
router.get("/:id", validateParams(idParamSchema), ingredientController.getById);
router.post("/", authenticate, validate(createIngredientSchema), ingredientController.create);
router.put(
  "/:id",
  authenticate,
  validateParams(idParamSchema),
  validate(updateIngredientSchema),
  ingredientController.update
);
router.delete("/:id", authenticate, validateParams(idParamSchema), ingredientController.remove);

export default router;
