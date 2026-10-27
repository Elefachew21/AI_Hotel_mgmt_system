import crypto from "node:crypto";
import User from "../models/User.js";
import { hashPassword } from "./auth.service.js";
import { sendPasswordResetEmail } from "./email.service.js";

const RESET_CODE_TTL_MINUTES = Number(
  process.env.PASSWORD_RESET_TTL_MINUTES || 10,
);
const RESET_CODE_MAX_ATTEMPTS = 5;

const normalizeEmail = (email) => email.toLowerCase().trim();

const hashResetCode = (email, code) =>
  crypto
    .createHash("sha256")
    .update(`${normalizeEmail(email)}:${code}`)
    .digest("hex");

const requestPasswordReset = async (email) => {
  const normalizedEmail = normalizeEmail(email);

  const user = await User.findOne({ email: normalizedEmail });

  // Do not reveal whether this account exists.
  if (!user) return;

  if (!Number.isFinite(RESET_CODE_TTL_MINUTES) || RESET_CODE_TTL_MINUTES <= 0) {
    throw new Error("Invalid password reset code lifetime.");
  }

  // Generate a six-digit code, including leading zeros.
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");

  const codeHash = hashResetCode(normalizedEmail, code);

  user.passwordResetTokenHash = codeHash;
  user.passwordResetExpiresAt = new Date(
    Date.now() + RESET_CODE_TTL_MINUTES * 60 * 1000,
  );
  user.passwordResetAttempts = 0;

  await user.save();

  try {
    await sendPasswordResetEmail({
      to: user.email,
      code,
      expiresAt: user.passwordResetExpiresAt,
    });
  } catch (error) {
    // Clear only the code created by this request.
    await User.updateOne(
      {
        _id: user._id,
        passwordResetTokenHash: codeHash,
      },
      {
        $unset: {
          passwordResetTokenHash: 1,
          passwordResetExpiresAt: 1,
        },
        $set: {
          passwordResetAttempts: 0,
        },
      },
    ).catch(() => {
      console.error("Failed to clear an undelivered password-reset code.");
    });

    console.error("Password-reset email delivery failed:", {
      message: error.message,
      code: error.code,
      responseCode: error.responseCode,
    });

    // Keep the public forgot-password response generic.
    // The caller can log the delivery failure internally.
  }
};

const resetPassword = async ({ email, code, password }) => {
  const normalizedEmail = normalizeEmail(email);

  if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
    const error = new Error("Invalid or expired password reset code.");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({
    email: normalizedEmail,
    passwordResetExpiresAt: { $gt: new Date() },
  }).select("+passwordResetTokenHash");

  const invalidCodeError = () => {
    const error = new Error("Invalid or expired password reset code.");
    error.statusCode = 400;
    return error;
  };

  if (
    !user ||
    !user.passwordResetTokenHash ||
    user.passwordResetAttempts >= RESET_CODE_MAX_ATTEMPTS
  ) {
    throw invalidCodeError();
  }

  const submittedHash = hashResetCode(normalizedEmail, code);
  const expected = Buffer.from(user.passwordResetTokenHash, "hex");
  const submitted = Buffer.from(submittedHash, "hex");

  const matches =
    expected.length === submitted.length &&
    crypto.timingSafeEqual(expected, submitted);

  if (!matches) {
    user.passwordResetAttempts += 1;

    if (user.passwordResetAttempts >= RESET_CODE_MAX_ATTEMPTS) {
      // Invalidate the code after too many incorrect attempts.
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpiresAt = undefined;
      user.passwordResetAttempts = 0;
    }

    await user.save();
    throw invalidCodeError();
  }

  const passwordHash = await hashPassword(password);

  // Change the password and invalidate previously issued access tokens.
  user.passwordHash = passwordHash;
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;

  // Consume the reset code after a successful password change.
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  user.passwordResetAttempts = 0;

  await user.save();

  return user;
};

export { requestPasswordReset, resetPassword };
