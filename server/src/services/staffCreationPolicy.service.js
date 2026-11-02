import mongoose from "mongoose";
import User from "../models/User.js";
import Role from "../models/Role.js";
import StaffCreationPolicy from "../models/StaffCreationPolicy.js";
import { recordAuditEvent } from "./auditLog.service.js";
import { createError } from "../errors/appError.js";

const verifySuperAdmin = async (actorId, session) => {
  if (!mongoose.isValidObjectId(actorId)) {
    throw createError("Invalid actor ID", 400);
  }

  let query = User.findById(actorId).select("status roleRef").populate({
    path: "roleRef",
    select: "name isActive",
  });

  if (session) query = query.session(session);

  const actor = await query;

  if (
    !actor ||
    actor.status !== "ACTIVE" ||
    !actor.roleRef ||
    !actor.roleRef.isActive ||
    actor.roleRef.name !== "SUPER_ADMIN"
  ) {
    throw createError(
      "Only an active Super Admin can manage staff-creation policies",
      403,
    );
  }

  return actor;
};

const validateTargetRoles = async (
  actorRole,
  allowedTargetRoleIds,
  allowAllActiveRoles,
  session,
) => {
  if (!Array.isArray(allowedTargetRoleIds)) {
    throw createError("allowedTargetRoleIds must be an array", 400);
  }

  if (typeof allowAllActiveRoles !== "boolean") {
    throw createError("allowAllActiveRoles must be a boolean", 400);
  }

  if (allowAllActiveRoles && actorRole.name !== "SUPER_ADMIN") {
    throw createError(
      "Only the Super Admin policy can allow all active roles",
      400,
    );
  }

  const ids = allowedTargetRoleIds.map(String);

  if (ids.some((id) => !mongoose.isValidObjectId(id))) {
    throw createError("One or more target role IDs are invalid", 400);
  }

  if (new Set(ids).size !== ids.length) {
    throw createError("Duplicate target role IDs are not allowed", 400);
  }

  if (ids.length === 0) return [];

  let query = Role.find({
    _id: { $in: ids },
    isActive: true,
  });

  if (session) query = query.session(session);

  const roles = await query;

  if (roles.length !== ids.length) {
    throw createError(
      "One or more target roles do not exist or are inactive",
      400,
    );
  }

  const forbiddenRole = roles.find(
    (role) =>
      role.name === "SUPER_ADMIN" ||
      (actorRole.name !== "SUPER_ADMIN" && role.name === "MANAGER"),
  );

  if (forbiddenRole) {
    throw createError(
      `The ${forbiddenRole.name} role cannot be assigned by this policy`,
      403,
    );
  }

  return roles.map((role) => role._id);
};

const saveStaffCreationPolicy = async ({
  actorId,
  actorRoleId,
  allowedTargetRoleIds = [],
  allowAllActiveRoles = false,
  isActive,
  requestId = null,
}) => {
  if (!mongoose.isValidObjectId(actorRoleId)) {
    throw createError("Invalid creator role ID", 400);
  }

  if (isActive !== undefined && typeof isActive !== "boolean") {
    throw createError("isActive must be a boolean", 400);
  }

  return mongoose.connection.transaction(async (session) => {
    const actor = await verifySuperAdmin(actorId, session);

    let actorRoleQuery = Role.findById(actorRoleId);
    actorRoleQuery = actorRoleQuery.session(session);

    const actorRole = await actorRoleQuery;

    if (!actorRole || !actorRole.isActive) {
      throw createError("Creator role does not exist or is inactive", 400);
    }

    const targetRoleIds = await validateTargetRoles(
      actorRole,
      allowedTargetRoleIds,
      allowAllActiveRoles,
      session,
    );

    const policy = await StaffCreationPolicy.findOne({
      actorRole: actorRole._id,
    }).session(session);

    let savedPolicy;
    let action;

    if (policy) {
      const previousState = {
        allowedTargetRoles: policy.allowedTargetRoles.map(String),
        allowAllActiveRoles: policy.allowAllActiveRoles,
        isActive: policy.isActive,
      };

      policy.allowedTargetRoles = targetRoleIds;
      policy.allowAllActiveRoles = allowAllActiveRoles;
      policy.updatedBy = actor._id;

      if (isActive !== undefined) {
        policy.isActive = isActive;
      }

      savedPolicy = await policy.save({ session });
      action = "staff_creation_policy.updated";

      await recordAuditEvent({
        actor: actor._id,
        actorRole: actor.roleRef.name,
        action,
        resourceType: "StaffCreationPolicy",
        resourceId: savedPolicy._id,
        outcome: "SUCCESS",
        requestId,
        details: {
          actorRoleId: String(actorRole._id),
          actorRoleName: actorRole.name,
          previousState,
          newState: {
            allowedTargetRoles: targetRoleIds.map(String),
            allowAllActiveRoles,
            isActive: savedPolicy.isActive,
          },
        },
        session,
      });
    } else {
      const [createdPolicy] = await StaffCreationPolicy.create(
        [
          {
            actorRole: actorRole._id,
            allowedTargetRoles: targetRoleIds,
            allowAllActiveRoles,
            isActive: isActive ?? true,
            createdBy: actor._id,
            updatedBy: actor._id,
          },
        ],
        { session },
      );

      savedPolicy = createdPolicy;
      action = "staff_creation_policy.created";

      await recordAuditEvent({
        actor: actor._id,
        actorRole: actor.roleRef.name,
        action,
        resourceType: "StaffCreationPolicy",
        resourceId: savedPolicy._id,
        outcome: "SUCCESS",
        requestId,
        details: {
          actorRoleId: String(actorRole._id),
          actorRoleName: actorRole.name,
          allowedTargetRoles: targetRoleIds.map(String),
          allowAllActiveRoles,
          isActive: savedPolicy.isActive,
        },
        session,
      });
    }

    return savedPolicy;
  });
};

const listStaffCreationPolicies = async (actorId) => {
  await verifySuperAdmin(actorId);

  return StaffCreationPolicy.find()
    .populate("actorRole", "name displayName isActive")
    .populate("allowedTargetRoles", "name displayName isActive")
    .populate("createdBy", "username firstName lastName")
    .populate("updatedBy", "username firstName lastName")
    .sort({ createdAt: -1 });
};

export { saveStaffCreationPolicy, listStaffCreationPolicies };
