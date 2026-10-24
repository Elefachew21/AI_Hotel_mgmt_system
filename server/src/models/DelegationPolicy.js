import mongoose from "mongoose";

const delegationPolicySchema = new mongoose.Schema(
  {
    // The role whose authority to delegate is controlled by this policy.
    // Example: the MANAGER role.
    actorRole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      immutable: true,
    },

    // Permissions this role is allowed to grant to eligible target roles.
    // These are references to existing Permission documents.
    delegablePermissions: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Permission",
        },
      ],
      default: [],
      validate: {
        validator(permissionIds) {
          const ids = permissionIds.map((id) => id.toString());
          return new Set(ids).size === ids.length;
        },
        message: "Duplicate permission IDs are not allowed.",
      },
    },

    // An inactive policy must not authorize new delegations.
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

// Maintain one policy per actor role.
delegationPolicySchema.index({ actorRole: 1 }, { unique: true });

const DelegationPolicy = mongoose.model(
  "DelegationPolicy",
  delegationPolicySchema,
);

export default DelegationPolicy;
