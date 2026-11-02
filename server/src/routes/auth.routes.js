import express from "express";
import {
  login,
  register,
  forgotPassword,
  verifyEmail,
  resetPasswordController,
  resendVerification,
} from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from "../utils/validation/auth.validation.js";
import {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  verifyEmailLimiter,
  resendVerificationLimiter,
} from "../middleware/authRateLimit.js";
import { refresh, logout, logoutAll } from "../controllers/auth.controller.js";

import { authenticate } from "../middleware/authenticate.js";
const router = express.Router();
router.post("/register", registerLimiter, validate(registerSchema), register);

router.post("/login", loginLimiter, validate(loginSchema), login);
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);
router.post(
  "/reset-password",
  resetPasswordLimiter,
  validate(resetPasswordSchema),
  resetPasswordController,
);
router.post(
  "/verify-email",
  verifyEmailLimiter,
  validate(verifyEmailSchema),
  verifyEmail,
);
router.post(
  "/resend-verification",
  resendVerificationLimiter,
  validate(resendVerificationSchema),
  resendVerification,
);
router.post("/refresh", loginLimiter, refresh);

router.post("/logout", logout);

router.post("/logout-all", authenticate, logoutAll);
export default router;
