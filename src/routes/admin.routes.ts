import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/stats", adminController.getStats);
router.get("/recipes", adminController.getRecipes);
router.post("/recipes", adminController.createRecipe);
router.delete("/recipes/:id", adminController.deleteRecipe);
router.put("/recipes/:id", adminController.updateRecipe);

export default router;
