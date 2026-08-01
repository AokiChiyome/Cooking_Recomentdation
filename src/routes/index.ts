import { Router } from "express";
import authRoutes from "./auth.routes";
import categoryRoutes from "./category.routes";
import ingredientRoutes from "./ingredient.routes";
import unitRoutes from "./unit.routes";
import recipeRoutes from "./recipe.routes";
import recipeCategoryRoutes from "./recipeCategory.routes";
import userIngredientRoutes from "./userIngredient.routes";
import dashboardRoutes from "./dashboard.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "OK", time: new Date().toISOString() });
});

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/ingredients", ingredientRoutes);
router.use("/units", unitRoutes);
router.use("/recipes", recipeRoutes);
router.use("/recipe-categories", recipeCategoryRoutes);
router.use("/user-ingredients", userIngredientRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
