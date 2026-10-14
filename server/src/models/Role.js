import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    permissions: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Permission",
        },
      ],
      default: [],
    },

    isSystemRole: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    
    // Permissions this role is explicitly allowed to delegate
    // when assigning permissions to another role.
    delegablePermissions: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Permission",
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate role names within this database.
roleSchema.index({ name: 1 }, { unique: true });

const Role = mongoose.model("Role", roleSchema);

export default Role;