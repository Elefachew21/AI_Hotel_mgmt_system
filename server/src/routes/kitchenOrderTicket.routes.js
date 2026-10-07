import express from "express";

import {
  createKot,
  getKots,
  getKot,
  startKotCooking,
  completeKot,
  cancelKitchenOrder
} from "../controllers/kitchenOrderTicket.controller.js";

import {authenticate} from "../middleware/authenticate.js";
import {authorize} from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { validateParams } from "../middleware/validateParams.js";

import {
  createKotSchema,
  kotParamsSchema,
  kotStatusQuerySchema
} from "../utils/validation/kitchenOrderTicket.validation.js";

const router = express.Router();
const managerOrKitchenStaff = authorize(
  "SUPER_ADMIN",
  "MANAGER",
  "KITCHEN_STAFF"
);
router.use(authenticate);

router.use(managerOrKitchenStaff);
router.post(
  "/",
  managerOrKitchenStaff,
  validate(createKotSchema),
  createKot
);

router.get(
  "/",
  managerOrKitchenStaff,
  
  validate(kotStatusQuerySchema, "query"),
  getKots
);

router.get(
  "/:id",
 managerOrKitchenStaff,
  validateParams(kotParamsSchema),
  getKot
);

router.patch(
  "/:id/cooking",
 managerOrKitchenStaff,
  validateParams(kotParamsSchema),
  startKotCooking
);

router.patch(
  "/:id/ready",
 managerOrKitchenStaff,
  validateParams(kotParamsSchema),
  completeKot
);

router.patch(
  "/:id/cancel",
 managerOrKitchenStaff,
  validateParams(kotParamsSchema),
  cancelKitchenOrder
);

export default router;