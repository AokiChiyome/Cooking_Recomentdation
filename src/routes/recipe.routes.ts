import { Router } from "express";
import { recipeController } from "../controllers/recipe.controller";
import { recipeInsightsController } from "../controllers/recipeInsights.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate, validateParams, validateQuery } from "../middleware/validate.middleware";
import {
  createRecipeSchema,
  listRecipeQuerySchema,
  updateRecipeSchema,
} from "../validators/recipe.validator";
import {
  almostCookableQuerySchema,
  listLimitQuerySchema,
  recipeNameParamSchema,
  searchByIngredientQuerySchema,
  searchByIngredientsQuerySchema,
} from "../validators/recipeInsights.validator";
import { uuidParamSchema } from "../validators/common.validator";

const router = Router();
const idParamSchema = uuidParamSchema("id");

// =========================================================================
// CÁC ROUTE TRA CỨU / GỢI Ý (map trực tiếp từ 9 câu query SQL) — ĐẶT TRƯỚC
// route "/:id" bên dưới, nếu không Express sẽ hiểu nhầm các path này là
// một recipeId.
// =========================================================================

// 1. Tìm món theo nguyên liệu
router.get(
  "/search-by-ingredient",
  validateQuery(searchByIngredientQuerySchema),
  recipeInsightsController.searchByIngredient
);

// 2. Tìm món có nhiều nguyên liệu nhất
router.get(
  "/most-ingredients",
  validateQuery(listLimitQuerySchema),
  recipeInsightsController.mostIngredients
);

// 8. Tìm món có thời gian nấu ngắn nhất
router.get(
  "/quickest",
  validateQuery(listLimitQuerySchema),
  recipeInsightsController.quickest
);

// 9. Tìm món dùng đồng thời nhiều nguyên liệu (X và Y ...)
router.get(
  "/search-by-ingredients",
  validateQuery(searchByIngredientsQuerySchema),
  recipeInsightsController.searchByIngredients
);

// 5. Món user hiện tại nấu được (đủ 100% nguyên liệu) — cần đăng nhập
router.get("/cookable", authenticate, recipeInsightsController.cookable);

// 7. Món user hiện tại nấu được gần đủ (>= threshold%) — cần đăng nhập
router.get(
  "/almost-cookable",
  authenticate,
  validateQuery(almostCookableQuerySchema),
  recipeInsightsController.almostCookable
);

// 3. Toàn bộ nguyên liệu của một món, tìm theo tên
router.get(
  "/by-name/:name/ingredients",
  validateParams(recipeNameParamSchema),
  recipeInsightsController.ingredientsByRecipeName
);

// 6. Nguyên liệu còn thiếu của user cho một món, tìm theo tên — cần đăng nhập
router.get(
  "/by-name/:name/missing-ingredients",
  authenticate,
  validateParams(recipeNameParamSchema),
  recipeInsightsController.missingIngredients
);

router.get("/saved", authenticate, recipeController.getSaved);
router.post("/:id/save", authenticate, validateParams(idParamSchema), recipeController.save);
router.delete("/:id/save", authenticate, validateParams(idParamSchema), recipeController.unsave);

router.get("/", validateQuery(listRecipeQuerySchema), recipeController.list);
router.get("/:id", validateParams(idParamSchema), recipeController.getById);
router.post("/", authenticate, validate(createRecipeSchema), recipeController.create);
router.put(
  "/:id",
  authenticate,
  validateParams(idParamSchema),
  validate(updateRecipeSchema),
  recipeController.update
);
router.delete("/:id", authenticate, validateParams(idParamSchema), recipeController.remove);

export default router;
