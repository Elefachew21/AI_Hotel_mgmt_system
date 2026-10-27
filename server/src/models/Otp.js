import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    // Keep the code tied to one specific security operation.
    purpose: {
      type: String,
      required: true,
      enum: [
        "GUEST_REGISTRATION",
        "STAFF_EMAIL_VERIFICATION",
        "PASSWORD_RESET",
      ],
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Store only a cryptographic hash, never the six-digit code itself.
    codeHash: {
      type: String,
      required: true,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxAttempts: {
      type: Number,
      required: true,
      default: 5,
      min: 1,
    },

    consumedAt: {
      type: Date,
      default: null,
    },

    lastSentAt: {
      type: Date,
      required: true,
    },

    sendWindowStartedAt: {
      type: Date,
      required: true,
    },

    sendsInWindow: {
      type: Number,
      default: 1,
      min: 0,
    },

    // Allows expired records to be cleaned up without immediately
    // deleting the rate-limit history when a code expires.
    cleanupAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// Only one current OTP record per email and security purpose.
OtpSchema.index({ email: 1, purpose: 1 }, { unique: true });

// MongoDB removes old records eventually. Expiry is also checked
// explicitly during verification; TTL cleanup is not the security check.
OtpSchema.index({ cleanupAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Otp", OtpSchema);
