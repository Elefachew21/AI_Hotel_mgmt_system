import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Preserve the role at the time of the action.
    actorRole: {
      type: String,
      trim: true,
      default: null,
    },

    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    resourceType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    resourceId: {
      type: String,
      default: null,
      maxlength: 120,
    },

    outcome: {
      type: String,
      required: true,
      enum: ["SUCCESS", "FAILURE"],
    },

    requestId: {
      type: String,
      default: null,
      maxlength: 100,
    },

    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
    versionKey: false,
  },
);

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({
  resourceType: 1,
  resourceId: 1,
  createdAt: -1,
});
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
