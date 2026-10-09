import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { completeTask, startTask } from "../controllers/housekeeping.controller.js";
import { housekeepingTaskParamsSchema } from "../utils/validation/housekeepingTask.validatiojn.js";
const router = express.Router();
router.patch(
  "/:id/start",
  authenticate,
  authorize("SUPER_ADMIN", "MANAGER", "HOUSEKEEPER"),
  validate(housekeepingTaskParamsSchema),
  startTask
);
router.patch(
  "/:id/complete",
  authenticate,
  authorize("SUPER_ADMIN", "MANAGER", "HOUSEKEEPER"),
  validate(housekeepingTaskParamsSchema),
  completeTask
);


export default router;
