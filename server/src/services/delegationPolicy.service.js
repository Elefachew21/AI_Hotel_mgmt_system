import mongoose from "mongoose";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Permission from "../models/Permission.js";
import DelegationPolicy from "../models/DelegationPolicy.js";
import { createError } from "../errors/appError.js";

// Only an active Super Admin can configure delegation policies.
const verifySuperAdmin = async (actorId) => {
  if (!mongoose.isValidObjectId(actorId)) {
    throw createError("Invalid actor ID", 400);
  }
  const actor = await User.findById(actorId).select("status roleRef").populate({
    path: "roleRef",
    select: "name isActive",
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
};

// Verify that the role whose delegation rights are being
// configured exists, is active, and is not SUPER_ADMIN.
const getEligibleActorRole = async (actorRoleId) => {
  if (!mongoose.isValidObjectId(actorRoleId)) {
    throw createError("Invalid target role ID", 400);
  }

  const role = await Role.findById(actorRoleId);

  if (!role || !role.isActive) {
    throw createError("Role does not exist or is inactive", 404);
  }

  if (role.name === "SUPER_ADMIN") {
    throw createError("SUPER_ADMIN does not need a delegation policy", 400);
  }

  return role;
};

// Validate permission IDs against active Permission documents.
const validateDelegablePermissions = async (permissionIds) => {
  if (!Array.isArray(permissionIds)) {
    throw createError("delegablePermissionIds must be an array", 400);
  }

  const ids = permissionIds.map((id) => String(id));

  if (ids.some((id) => !mongoose.isValidObjectId(id))) {
    throw createError("One or more permission IDs are invalid", 400);
  }

  if (new Set(ids).size !== ids.length) {
    throw createError("Duplicate permission IDs are not allowed", 400);
  }

  // An empty array is valid: it means no permissions may be delegated.
  if (ids.length === 0) {
    return [];
  }

  const permissions = await Permission.find({
    _id: { $in: ids },
    isActive: true,
  }).select("_id");

  if (permissions.length !== ids.length) {
    throw createError(
      "One or more permissions do not exist or are inactive",
      400,
    );
  }

  return permissions.map((permission) => permission._id);
};

/**
 * Create a delegation policy or update an existing one.
 *
 * actorId: the logged-in Super Admin's user ID.
 * actorRoleId: the role whose delegation authority is controlled.
 * delegablePermissionIds: IDs of permissions this role may delegate.
 * isActive: optional policy activation setting.
 */
const saveDelegationPolicy = async ({
  actorId,
  actorRoleId,
  delegablePermissionIds,
  isActive,
}) => {
  await verifySuperAdmin(actorId);

  const actorRole = await getEligibleActorRole(actorRoleId);

  const permissionIds = await validateDelegablePermissions(
    delegablePermissionIds,
  );

  if (isActive !== undefined && typeof isActive !== "boolean") {
    throw createError("isActive must be a boolean", 400);
  }

  let policy = await DelegationPolicy.findOne({
    actorRole: actorRole._id,
  });

  if (policy) {
    // Preserve the current activation state unless explicitly changed.
    policy.delegablePermissions = permissionIds;
    policy.updatedBy = actorId;

    if (isActive !== undefined) {
      policy.isActive = isActive;
    }

    await policy.save();
    return policy;
  }

  policy = await DelegationPolicy.create({
    actorRole: actorRole._id,
    delegablePermissions: permissionIds,
    isActive: isActive ?? true,
    createdBy: actorId,
    updatedBy: actorId,
  });

  return policy;
};

export { saveDelegationPolicy };
