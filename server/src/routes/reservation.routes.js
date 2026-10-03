import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createReservationSchema } from "../utils/validation/reservation.validation.js";
import { create } from "../controllers/reservation.controller.js";
//checkin  related import
import { validateParams } from "../middleware/validateParams.js";

import { checkInParamsSchema } from "../utils/validation/checkin.validation.js";

// reservation confirming related import
import { confirm } from "../controllers/confirmation.controller.js";
import { confirmReservationParamsSchema } from "../utils/validation/confirmation.validation.js";
import { checkIn } from "../controllers/checkin.controller.js";
// guest Checkout 
import { checkOutParamsSchema } from "../utils/validation/checkout.validation.js";
import { checkOut } from "../controllers/checkout.controller.js";

const router = express.Router();
//check in route
router.post("/", authenticate, authorize("SUPER_ADMIN", "MANAGER", "RECEPTIONIST"), validate(createReservationSchema), create);
router.post("/:id/check-in",
    authenticate,
    authorize(
          "SUPER_ADMIN",
        "MANAGER",
        "RECEPTIONIST"
    ),
     validateParams(checkInParamsSchema),
    checkIn
)
//confirmation route
router.post(
  "/:id/confirm",
  authenticate,
  authorize("SUPER_ADMIN", "MANAGER", "RECEPTIONIST"),
  validateParams(confirmReservationParamsSchema),
  confirm
);

// CheckOut route
router.post("/:id/check-out",
  authenticate,
  authorize("SUPER_ADMIN", "MANAGER", "RECEPTIONIST"),
  validateParams(checkOutParamsSchema),
  checkOut
)
export default router;