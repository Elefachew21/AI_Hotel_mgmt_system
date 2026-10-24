import mongoose from "mongoose";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Permission from "../models/Permission.js";
import DelegationPolicy from "../models/DelegationPolicy.js";
import { createError } from "../errors/appError.js";
const getActiveActor = async (actorId) => {
  if (!mongoose.isValidObjectId(actorId)) {
    throw createError("Invalid actor ID", 400);
  }

  const actor = await User.findById(actorId)
    .select("status roleRef")
    .populate({
      path: "roleRef",
      select: "name isActive permissions",
      populate: {
        path: "permissions",
        select: "key isActive",
      },
    });

  if (
    !actor ||
    actor.status !== "ACTIVE" ||
    !actor.roleRef ||
    !actor.roleRef.isActive
  ) {
    throw createError("Active user with an active role is required", 403);
  }

  return actor;
};

const hasPermission = (actor, permissionKey) =>
  actor.roleRef.permissions.some(
    (permission) => permission.key === permissionKey && permission.isActive,
  );

const requirePermission = (actor, permissionKey) => {
  if (actor.roleRef.name === "SUPER_ADMIN") {
    return;
  }

  if (!hasPermission(actor, permissionKey)) {
    throw createError(
      `You are not authorized to perform this operation: ${permissionKey}`,
      403,
    );
  }
};

const getActivePermissions = async (permissionIds) => {
  if (!Array.isArray(permissionIds)) {
    throw createError("permissions must be an array of permission IDs", 400);
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
  }).select("_id key isActive");

  if (permissions.length !== ids.length) {
    throw createError(
      "One or more permissions do not exist or are inactive",
      400,
    );
  }

  return permissions;
};

const enforceDelegationPolicy = async (actor, permissions) => {
  // Super Admin can grant any existing active permission.
  if (actor.roleRef.name === "SUPER_ADMIN") {
    return;
  }

  const policy = await DelegationPolicy.findOne({
    actorRole: actor.roleRef._id,
    isActive: true,
  }).populate({
    path: "delegablePermissions",
    select: "key isActive",
  });

  if (!policy) {
    throw createError("No active delegation policy exists for your role", 403);
  }

  const allowedKeys = new Set(
    policy.delegablePermissions
      .filter((permission) => permission.isActive)
      .map((permission) => permission.key),
  );

  const forbidden = permissions
    .map((permission) => permission.key)
    .filter((key) => !allowedKeys.has(key));

  if (forbidden.length > 0) {
    throw createError(
      `You cannot delegate these permissions: ${forbidden.join(", ")}`,
      403,
    );
  }
};

const validateRoleName = (name) => {
  if (typeof name !== "string" || !name.trim()) {
    throw createError("Role name is required", 400);
  }

  const normalizedName = name.trim().toUpperCase();

  if (!/^[A-Z][A-Z0-9_]*$/.test(normalizedName)) {
    throw createError(
      "Role name must use uppercase letters, numbers, and underscores",
      400,
    );
  }

  return normalizedName;
};

const createRole = async ({
  actorId,
  name,
  displayName,
  description = "",
  permissionIds = [],
}) => {
  const actor = await getActiveActor(actorId);

  requirePermission(actor, "roles:create");
  requirePermission(actor, "roles:manage-permissions");

  const normalizedName = validateRoleName(name);

  if (normalizedName === "SUPER_ADMIN") {
    throw createError("SUPER_ADMIN cannot be created as a custom role", 403);
  }

  if (typeof displayName !== "string" || !displayName.trim()) {
    throw createError("Role displayName is required", 400);
  }

  if (actor.roleRef.name === "MANAGER" && normalizedName === "MANAGER") {
    throw createError("Managers cannot create another MANAGER role", 403);
  }

  const existingRole = await Role.findOne({ name: normalizedName });

  if (existingRole) {
    throw createError("A role with this name already exists", 409);
  }

  const permissions = await getActivePermissions(permissionIds);
  await enforceDelegationPolicy(actor, permissions);

  try {
    return await Role.create({
      name: normalizedName,
      displayName: displayName.trim(),
      description: typeof description === "string" ? description.trim() : "",
      permissions: permissions.map((permission) => permission._id),
      isSystemRole: false,
      isActive: true,
      createdBy: actor._id,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw createError("A role with this name already exists", 409);
    }

    throw error;
  }
};

const updateRolePermissions = async ({ actorId, roleId, permissionIds }) => {
  const actor = await getActiveActor(actorId);

  requirePermission(actor, "roles:update");
  requirePermission(actor, "roles:manage-permissions");

  if (!mongoose.isValidObjectId(roleId)) {
    throw createError("Invalid role ID", 400);
  }

  const targetRole = await Role.findById(roleId);
  if (!targetRole) {
    throw createError("Role not found", 404);
  }
  if (
    targetRole.name === "SUPER_ADMIN" &&
    actor.roleRef.name !== "SUPER_ADMIN"
  ) {
    throw createError("Only Super Admin can modify the SUPER_ADMIN role", 403);
  }
  if (
    actor.roleRef.name !== "SUPER_ADMIN" &&
    actor.roleRef.name !== "MANAGER" &&
    (targetRole.isSystemRole ||
      targetRole.name === "SUPER_ADMIN" ||
      targetRole.name === "MANAGER")
  ) {
    throw createError(
      "Only Super Admins and Managers can modify permissions of system roles",
      403,
    );
  }

  const permissions = await getActivePermissions(permissionIds);
  await enforceDelegationPolicy(actor, permissions);

  targetRole.permissions = permissions.map((permission) => permission._id);

  targetRole.updatedBy = actor._id;

  await targetRole.save();
  await targetRole.populate("updatedBy", "username firstName lastName email");
  return targetRole;
};

const listRoles = async ({ actorId }) => {
  const actor = await getActiveActor(actorId);

  requirePermission(actor, "roles:read");

  return Role.find()
    .populate({
      path: "permissions",
      select: "key name module description isActive",
    })
    .populate({
      path: "createdBy",
      select: "username firstName lastName",
    })
    .sort({ name: 1 });
};

const getRoleById = async ({ actorId, roleId }) => {
  const actor = await getActiveActor(actorId);

  requirePermission(actor, "roles:read");

  if (!mongoose.isValidObjectId(roleId)) {
    throw createError("Invalid role ID", 400);
  }

  const role = await Role.findById(roleId)
    .populate({
      path: "permissions",
      select: "key name module description isActive",
    })
    .populate({
      path: "createdBy",
      select: "username firstName lastName",
    });

  if (!role) {
    throw createError("Role not found", 404);
  }

  return role;
};

const updateRoleStatus = async ({ actorId, roleId, isActive }) => {
  const actor = await getActiveActor(actorId);

  requirePermission(actor, "roles:update");

  if (!mongoose.isValidObjectId(roleId)) {
    throw createError("Invalid role ID", 400);
  }

  if (typeof isActive !== "boolean") {
    throw createError("isActive must be a boolean", 400);
  }

  const role = await Role.findById(roleId);

  if (!role) {
    throw createError("Role not found", 404);
  }

  // Protect built-in roles from accidental lockout.

  if (!isActive && role.isDeactivationProtected) {
    throw createError("This role is protected from deactivation", 403);
  }

  // Avoid disabling a role while active users still depend on it.
  if (!isActive) {
    const assignedActiveUser = await User.exists({
      roleRef: role._id,
      status: "ACTIVE",
    });

    if (assignedActiveUser) {
      throw createError(
        "Reassign active users before deactivating this role",
        409,
      );
    }
  }

  role.isActive = isActive;
  await role.save();

  return role;
};

export {
  createRole,
  updateRolePermissions,
  listRoles,
  getRoleById,
  updateRoleStatus,
};
