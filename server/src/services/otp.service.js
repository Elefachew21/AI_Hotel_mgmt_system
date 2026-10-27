import crypto from "node:crypto";
import Otp from "../models/Otp.js";

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const OTP_RESEND_COOLDOWN_SECONDS = Number(
  process.env.OTP_RESEND_COOLDOWN_SECONDS || 60,
);
const OTP_MAX_SENDS_PER_WINDOW = Number(
  process.env.OTP_MAX_SENDS_PER_WINDOW || 3,
);
const OTP_SEND_WINDOW_MINUTES = Number(
  process.env.OTP_SEND_WINDOW_MINUTES || 15,
);

const OTP_PURPOSES = [
  "GUEST_REGISTRATION",
  "STAFF_EMAIL_VERIFICATION",
  "PASSWORD_RESET",
];

const validateConfiguration = () => {
  const secret = process.env.OTP_HMAC_SECRET;

  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error(
      "OTP_HMAC_SECRET must be configured with at least 32 bytes.",
    );
  }

  const positiveSettings = [
    OTP_TTL_MINUTES,
    OTP_MAX_ATTEMPTS,
    OTP_RESEND_COOLDOWN_SECONDS,
    OTP_MAX_SENDS_PER_WINDOW,
    OTP_SEND_WINDOW_MINUTES,
  ];

  if (!positiveSettings.every((value) => Number.isFinite(value) && value > 0)) {
    throw new Error("Invalid OTP security configuration.");
  }
};

const normalizeEmail = (email) => email.toLowerCase().trim();

const hashOtp = ({ email, purpose, code }) => {
  validateConfiguration();

  return crypto
    .createHmac("sha256", process.env.OTP_HMAC_SECRET)
    .update(`${purpose}:${normalizeEmail(email)}:${code}`)
    .digest("hex");
};

const createOtpCode = () =>
  crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");

const createOtpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const issueOtp = async ({ userId, email, purpose }) => {
  validateConfiguration();

  if (!OTP_PURPOSES.includes(purpose)) {
    throw new Error("Unsupported OTP purpose.");
  }

  const normalizedEmail = normalizeEmail(email);
  const now = new Date();

  let existingOtp = await Otp.findOne({
    email: normalizedEmail,
    purpose,
  }).select("+codeHash");

  if (existingOtp) {
    const windowStarted =
      now.getTime() - existingOtp.sendWindowStartedAt.getTime() <
      OTP_SEND_WINDOW_MINUTES * 60 * 1000;

    if (
      existingOtp.consumedAt === null &&
      existingOtp.expiresAt > now &&
      now.getTime() - existingOtp.lastSentAt.getTime() <
        OTP_RESEND_COOLDOWN_SECONDS * 1000
    ) {
      throw createOtpError("Please wait before requesting another code.", 429);
    }

    if (
      existingOtp.consumedAt === null &&
      existingOtp.expiresAt > now &&
      windowStarted &&
      existingOtp.sendsInWindow >= OTP_MAX_SENDS_PER_WINDOW
    ) {
      throw createOtpError(
        "Too many codes requested. Please try again later.",
        429,
      );
    }
  }

  const code = createOtpCode();
  const codeHash = hashOtp({
    email: normalizedEmail,
    purpose,
    code,
  });

  const sendWindowStartedAt =
    existingOtp &&
    now.getTime() - existingOtp.sendWindowStartedAt.getTime() <
      OTP_SEND_WINDOW_MINUTES * 60 * 1000
      ? existingOtp.sendWindowStartedAt
      : now;

  const sendsInWindow =
    existingOtp &&
    now.getTime() - existingOtp.sendWindowStartedAt.getTime() <
      OTP_SEND_WINDOW_MINUTES * 60 * 1000
      ? existingOtp.sendsInWindow + 1
      : 1;

  const expiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000);

  const cleanupAt = new Date(
    now.getTime() +
      Math.max(OTP_TTL_MINUTES, OTP_SEND_WINDOW_MINUTES) * 60 * 1000 +
      60 * 60 * 1000,
  );

  await Otp.findOneAndUpdate(
    { email: normalizedEmail, purpose },
    {
      $set: {
        userId,
        email: normalizedEmail,
        purpose,
        codeHash,
        expiresAt,
        attempts: 0,
        maxAttempts: OTP_MAX_ATTEMPTS,
        consumedAt: null,
        lastSentAt: now,
        sendWindowStartedAt,
        sendsInWindow,
        cleanupAt,
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  return {
    code,
    expiresAt,
    email: normalizedEmail,
    purpose,
    userId,
  };
};

const verifyOtp = async ({ email, purpose, code, userId }) => {
  validateConfiguration();

  if (!OTP_PURPOSES.includes(purpose)) {
    throw createOtpError("Invalid or expired code.", 400);
  }

  if (!/^\d{6}$/.test(code)) {
    throw createOtpError("Invalid or expired code.", 400);
  }

  const normalizedEmail = normalizeEmail(email);
  const now = new Date();

  const otp = await Otp.findOne({
    email: normalizedEmail,
    purpose,
    userId,
    consumedAt: null,
    expiresAt: { $gt: now },
  }).select("+codeHash");

  if (!otp || otp.attempts >= otp.maxAttempts) {
    throw createOtpError("Invalid or expired code.", 400);
  }

  const submittedHash = hashOtp({
    email: normalizedEmail,
    purpose,
    code,
  });

  const expected = Buffer.from(otp.codeHash, "hex");
  const submitted = Buffer.from(submittedHash, "hex");

  const matches =
    expected.length === submitted.length &&
    crypto.timingSafeEqual(expected, submitted);

  if (!matches) {
    const updated = await Otp.findOneAndUpdate(
      {
        _id: otp._id,
        consumedAt: null,
        expiresAt: { $gt: now },
        attempts: otp.attempts,
        codeHash: otp.codeHash,
      },
      { $inc: { attempts: 1 } },
      { new: true },
    );

    if (!updated || updated.attempts >= updated.maxAttempts) {
      throw createOtpError("Invalid or expired code.", 400);
    }

    throw createOtpError("Invalid or expired code.", 400);
  }

  const consumed = await Otp.findOneAndUpdate(
    {
      _id: otp._id,
      consumedAt: null,
      expiresAt: { $gt: now },
      attempts: { $lt: otp.maxAttempts },
      codeHash: otp.codeHash,
    },
    { $set: { consumedAt: now } },
    { new: true },
  );

  if (!consumed) {
    throw createOtpError("Invalid or expired code.", 400);
  }

  return { verified: true, email: normalizedEmail, userId: otp.userId };
};

export { issueOtp, verifyOtp };
