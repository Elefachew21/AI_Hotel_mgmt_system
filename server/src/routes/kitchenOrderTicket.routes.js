import express from "express";
import {
  getKots,
  getKot,
  startKotCooking,
  completeKot,
  cancelKitchenOrder,
} from "../controllers/kitchenOrderTicket.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { validateParams } from "../middleware/validateParams.js";
import {
  kotParamsSchema,
  kotStatusQuerySchema,
} from "../utils/validation/kitchenOrderTicket.validation.js";
const router = express.Router();
const managerOrKitchenStaff = authorize(
  "SUPER_ADMIN",
  "MANAGER",
  "KITCHEN_STAFF",
);
router.use(authenticate);
router.use(managerOrKitchenStaff);
router.get("/", validate(kotStatusQuerySchema, "query"), getKots);
router.get("/:id", validateParams(kotParamsSchema), getKot);
router.patch("/:id/cooking", validateParams(kotParamsSchema), startKotCooking);
router.patch("/:id/ready", validateParams(kotParamsSchema), completeKot);
router.patch(
  "/:id/cancel",
  validateParams(kotParamsSchema),
  cancelKitchenOrder,
);
export default router;
