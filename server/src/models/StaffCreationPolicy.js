import mongoose from "mongoose";

const staffCreationPolicySchema = new mongoose.Schema(
  {
    // The role whose staff-creation authority is controlled.
    actorRole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      immutable: true,
    },

    // Specific roles this creator is allowed to assign.
    allowedTargetRoles: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Role",
        },
      ],
      default: [],
      validate: {
        validator(roleIds) {
          const ids = roleIds.map((id) => id.toString());
          return new Set(ids).size === ids.length;
        },
        message: "Duplicate target role IDs are not allowed.",
      },
    },

    // When true, all eligible active target roles are allowed.
    // This setting is reserved for the Super Admin policy.
    allowAllActiveRoles: {
      type: Boolean,
      default: false,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// One staff-creation policy per creator role.
staffCreationPolicySchema.index({ actorRole: 1 }, { unique: true });

const StaffCreationPolicy = mongoose.model(
  "StaffCreationPolicy",
  staffCreationPolicySchema,
);

export default StaffCreationPolicy;
