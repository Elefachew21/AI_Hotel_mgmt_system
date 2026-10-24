import mongoose from "mongoose";
import User from "../models/User.js";
import Role from "../models/Role.js";
import StaffCreationPolicy from "../models/StaffCreationPolicy.js";
import { createError } from "../errors/appError.js";

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
      "Only an active Super Admin can manage staff-creation policies",
      403,
    );
  }
};

const validateTargetRoles = async (
  actorRole,
  allowedTargetRoleIds,
  allowAllActiveRoles,
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

  if (ids.length === 0) {
    return [];
  }

  const roles = await Role.find({
    _id: { $in: ids },
    isActive: true,
  });

  if (roles.length !== ids.length) {
    throw createError(
      "One or more target roles do not exist or are inactive",
      400,
    );
  }

  // No policy may allow creation of a Super Admin.
  // Only Super Admin may configure Manager as a target role.
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
}) => {
  await verifySuperAdmin(actorId);

  if (!mongoose.isValidObjectId(actorRoleId)) {
    throw createError("Invalid creator role ID", 400);
  }

  if (isActive !== undefined && typeof isActive !== "boolean") {
    throw createError("isActive must be a boolean", 400);
  }

  const actorRole = await Role.findById(actorRoleId);

  if (!actorRole || !actorRole.isActive) {
    throw createError("Creator role does not exist or is inactive", 400);
  }

  const targetRoleIds = await validateTargetRoles(
    actorRole,
    allowedTargetRoleIds,
    allowAllActiveRoles,
  );

  let policy = await StaffCreationPolicy.findOne({
    actorRole: actorRole._id,
  });

  if (policy) {
    policy.allowedTargetRoles = targetRoleIds;
    policy.allowAllActiveRoles = allowAllActiveRoles;
    policy.updatedBy = actorId;

    if (isActive !== undefined) {
      policy.isActive = isActive;
    }

    await policy.save();
  } else {
    policy = await StaffCreationPolicy.create({
      actorRole: actorRole._id,
      allowedTargetRoles: targetRoleIds,
      allowAllActiveRoles,
      isActive: isActive ?? true,
      createdBy: actorId,
      updatedBy: actorId,
    });
  }

  return policy;
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
