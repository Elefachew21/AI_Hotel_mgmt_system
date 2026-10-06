import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createPaymentSchema } from "../utils/validation/payment.validation.js";
import { createPayment } from "../controllers/payment.controller.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "MANAGER",
    "CASHIER",
    "RECEPTIONIST"
  ),
  validate(createPaymentSchema),
  createPayment
);

export default router;