import { Router } from "express";
import { unitController } from "../controllers/unit.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate, validateParams, validateQuery } from "../middleware/validate.middleware";
import { createUnitSchema, listUnitQuerySchema, updateUnitSchema } from "../validators/unit.validator";
import { uuidParamSchema } from "../validators/common.validator";

const router = Router();
const idParamSchema = uuidParamSchema("id");

router.get("/", validateQuery(listUnitQuerySchema), unitController.list);
router.get("/:id", validateParams(idParamSchema), unitController.getById);
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createUnitSchema),
  unitController.create
);
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validateParams(idParamSchema),
  validate(updateUnitSchema),
  unitController.update
);
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validateParams(idParamSchema),
  unitController.remove
);

export default router;
