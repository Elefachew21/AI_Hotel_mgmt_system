import mongoose from "mongoose";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Permission from "../models/Permission.js";
import DelegationPolicy from "../models/DelegationPolicy.js";
import { createError } from "../errors/appError.js";
import { recordAuditEvent } from "./auditLog.service.js";

// Only an active Super Admin can configure delegation policies.
const verifySuperAdmin = async (actorId, session) => {
  if (!mongoose.isValidObjectId(actorId)) {
    throw createError("Invalid actor ID", 400);
  }

  const actor = await User.findById(actorId)
    .select("status roleRef")
    .session(session)
    .populate({
      path: "roleRef",
      select: "name isActive",
      options: { session },
    });

  if (
    !actor ||
    actor.status !== "ACTIVE" ||
    !actor.roleRef ||
    !actor.roleRef.isActive ||
    actor.roleRef.name !== "SUPER_ADMIN"
  ) {
    throw createError(
      "Only an active Super Admin can manage delegation policies",
      403,
    );
  }

  return actor;
};

const getEligibleActorRole = async (actorRoleId, session) => {
  if (!mongoose.isValidObjectId(actorRoleId)) {
    throw createError("Invalid target role ID", 400);
  }

  const role = await Role.findById(actorRoleId).session(session);

  if (!role || !role.isActive) {
    throw createError("Role does not exist or is inactive", 404);
  }

  if (role.name === "SUPER_ADMIN") {
    throw createError("SUPER_ADMIN does not need a delegation policy", 400);
  }

  return role;
};

const validateDelegablePermissions = async (permissionIds, session) => {
  if (!Array.isArray(permissionIds)) {
    throw createError("delegablePermissionIds must be an array", 400);
  }

  const ids = permissionIds.map(String);

  if (ids.some((id) => !mongoose.isValidObjectId(id))) {
    throw createError("One or more permission IDs are invalid", 400);
  }

  if (new Set(ids).size !== ids.length) {
    throw createError("Duplicate permission IDs are not allowed", 400);
  }

  if (ids.length === 0) {
    return [];
  }

  const permissions = await Permission.find({
    _id: { $in: ids },
    isActive: true,
  })
    .select("_id")
    .session(session);

  if (permissions.length !== ids.length) {
    throw createError(
      "One or more permissions do not exist or are inactive",
      400,
    );
  }

  return permissions.map((permission) => permission._id);
};

const saveDelegationPolicy = async ({
  actorId,
  actorRoleId,
  delegablePermissionIds,
  isActive,
  requestId = null,
}) => {
  return mongoose.connection.transaction(async (session) => {
    const actor = await verifySuperAdmin(actorId, session);

    const actorRole = await getEligibleActorRole(actorRoleId, session);

    const permissionIds = await validateDelegablePermissions(
      delegablePermissionIds,
      session,
    );

    if (isActive !== undefined && typeof isActive !== "boolean") {
      throw createError("isActive must be a boolean", 400);
    }

    let policy = await DelegationPolicy.findOne({
      actorRole: actorRole._id,
    }).session(session);

    const isCreating = !policy;

    // Capture the old values before changing the document.
    const previous = policy
      ? {
          delegablePermissionIds: policy.delegablePermissions.map(String),
          isActive: policy.isActive,
        }
      : null;

    if (policy) {
      policy.delegablePermissions = permissionIds;
      policy.updatedBy = actor._id;

      if (isActive !== undefined) {
        policy.isActive = isActive;
      }

      await policy.save({ session });
    } else {
      [policy] = await DelegationPolicy.create(
        [
          {
            actorRole: actorRole._id,
            delegablePermissions: permissionIds,
            isActive: isActive ?? true,
            createdBy: actor._id,
            updatedBy: actor._id,
          },
        ],
        { session },
      );
    }

    await recordAuditEvent({
      action: isCreating
        ? "delegation_policy.created"
        : "delegation_policy.updated",
      actor: actor._id,
      actorRole: actor.roleRef._id,
      resourceType: "DelegationPolicy",
      resourceId: policy._id,
      outcome: "SUCCESS",
      requestId,
      details: {
        targetRoleId: String(actorRole._id),
        targetRoleName: actorRole.name,
        previous,
        current: {
          delegablePermissionIds: permissionIds.map(String),
          isActive: policy.isActive,
        },
      },
      session,
    });

    return policy;
  });
};

export { saveDelegationPolicy };
