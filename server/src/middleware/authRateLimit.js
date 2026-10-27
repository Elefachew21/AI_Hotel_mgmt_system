import rateLimit from "express-rate-limit";

const createAuthLimiter = ({ windowMs, limit, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
  });

// Login: limit repeated password-guessing attempts.
export const loginLimiter = createAuthLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Too many login attempts. Please try again later.",
});

// Registration: reduce automated account creation.
export const registerLimiter = createAuthLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: "Too many registration attempts. Please try again later.",
});

// Forgot password: reduce reset-email abuse.
export const forgotPasswordLimiter = createAuthLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: "Too many password-reset requests. Please try again later.",
});

// Reset password: restrict repeated code submissions.
export const resetPasswordLimiter = createAuthLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Too many password-reset attempts. Please try again later.",
});

// Email verification: restrict repeated OTP submissions.
export const verifyEmailLimiter = createAuthLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Too many verification attempts. Please try again later.",
});

// Resend verification: reduce email flooding.
export const resendVerificationLimiter = createAuthLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  message: "Too many verification requests. Please try again later.",
});
