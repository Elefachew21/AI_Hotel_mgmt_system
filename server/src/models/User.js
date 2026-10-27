import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    // Optional username for profile display.
    username: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    // Keep temporarily for compatibility with existing code.
    role: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    }, // New database-backed role relationship.
    roleRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "ACTIVE",
    },
    tokenVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastLoginAt: {
      type: Date,
    },

    // Store only the hash of the password-reset token.
    passwordResetTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    // The reset token must expire.
    passwordResetExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    emailVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    passwordResetAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);
userSchema.index({ roleRef: 1 });
export default mongoose.model("User", userSchema);
