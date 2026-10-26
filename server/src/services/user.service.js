import mongoose from "mongoose";
import { recordAuditEvent } from "./auditLog.service.js";
import User from "../models/User.js";
import Role from "../models/Role.js";
import { hashPassword } from "./auth.service.js";
import StaffCreationPolicy from "../models/StaffCreationPolicy.js";
import { createError } from "../errors/appError.js";

const getUsers = async ({ page = 1, limit = 25 } = {}) => {
  const parsedPage = Number(page);
  const parsedLimit = Number(limit);

  if (
    !Number.isInteger(parsedPage) ||
    parsedPage < 1 ||
    !Number.isInteger(parsedLimit) ||
    parsedLimit < 1
  ) {
    const error = new Error("page and limit must be positive integers");
    error.statusCode = 400;
    throw error;
  }

  // Prevent requests from returning excessively large pages.
  const safeLimit = Math.min(parsedLimit, 100);
  const skip = (parsedPage - 1) * safeLimit;

  const [users, total] = await Promise.all([
    User.find()
      .select("-passwordHash")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    User.countDocuments(),
  ]);

  return {
    data: users,
    pagination: {
      page: parsedPage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

const getUserById = async (userId) => {
  return User.findById(userId).select("-passwordHash");
};

const createStaff = async ({
  username,
  firstName,
  lastName,
  email,
  phone,
  password,
  roleId,
  actorId,
  requestId = null,
}) => {
  const normalizedEmail = email.toLowerCase().trim();
  const passwordHash = await hashPassword(password);

  return mongoose.connection.transaction(async (session) => {
    // 1. Load the actor and their current role.
    const actor = await User.findById(actorId)
      .select("status roleRef")
      .populate({
        path: "roleRef",
        select: "name isActive permissions",
        populate: {
          path: "permissions",
          select: "key isActive",
        },
      })
      .session(session);

    if (
      !actor ||
      actor.status !== "ACTIVE" ||
      !actor.roleRef ||
      !actor.roleRef.isActive
    ) {
      const error = new Error("An active user with an active role is required");
      error.statusCode = 403;
      throw error;
    }

    const isSuperAdmin = actor.roleRef.name === "SUPER_ADMIN";

    // 2. Check staff-creation permission.
    const hasCreatePermission = actor.roleRef.permissions.some(
      (permission) =>
        permission.isActive && permission.key === "users:create-staff",
    );

    if (!isSuperAdmin && !hasCreatePermission) {
      const error = new Error(
        "You are not authorized to create staff accounts",
      );
      error.statusCode = 403;
      throw error;
    }

    // 3. Require an active staff-creation policy.
    const policy = await StaffCreationPolicy.findOne({
      actorRole: actor.roleRef._id,
      isActive: true,
    }).session(session);

    if (!policy) {
      const error = new Error(
        "No active staff-creation policy exists for your role",
      );
      error.statusCode = 403;
      throw error;
    }

    // 4. Load the requested target role.
    const targetRole = await Role.findById(roleId).session(session);

    if (!targetRole || !targetRole.isActive) {
      const error = new Error("Selected role does not exist or is inactive");
      error.statusCode = 400;
      throw error;
    }

    // 5. Preserve permanent role-hierarchy restrictions.
    if (targetRole.name === "SUPER_ADMIN") {
      const error = new Error(
        "Super Admin accounts cannot be created through staff creation",
      );
      error.statusCode = 403;
      throw error;
    }

    if (!isSuperAdmin && targetRole.name === "MANAGER") {
      const error = new Error(
        "Only a Super Admin can create a Manager account",
      );
      error.statusCode = 403;
      throw error;
    }

    // 6. Enforce the staff-creation policy.
    const targetIsAllowed =
      isSuperAdmin && policy.allowAllActiveRoles
        ? true
        : !policy.allowAllActiveRoles &&
          policy.allowedTargetRoles.some(
            (allowedRoleId) =>
              allowedRoleId.toString() === targetRole._id.toString(),
          );

    if (!targetIsAllowed) {
      const error = new Error(
        "Your staff-creation policy does not allow assigning this role",
      );
      error.statusCode = 403;
      throw error;
    }

    // 7. Check for an existing email.
    const existingUser = await User.findOne({
      email: normalizedEmail,
    }).session(session);

    if (existingUser) {
      const error = new Error("Email is already registered");
      error.statusCode = 409;
      throw error;
    }

    // 8. Create the staff account within the transaction.
    const [user] = await User.create(
      [
        {
          username,
          firstName,
          lastName,
          email: normalizedEmail,
          phone,
          passwordHash,
          role: targetRole.name,
          roleRef: targetRole._id,
          status: "ACTIVE",
        },
      ],
      { session },
    );

    // 9. Record the successful creation in the same transaction.
    await recordAuditEvent({
      actor: actor._id,
      actorRole: actor.roleRef.name,
      action: "users.staff_created",
      resourceType: "User",
      resourceId: user._id,
      outcome: "SUCCESS",
      requestId,
      details: {
        username: user.username,
        assignedRole: targetRole.name,
      },
      session,
    });

    return user;
  });
};

const updateStaff = async ({ userId, actorId, updates, requestId = null }) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw createError("Invalid staff user ID.", 400);
  }

  const allowedFields = [
    "username",
    "firstName",
    "lastName",
    "phone",
    "roleId",
    "status",
  ];

  const requestedFields = Object.keys(updates);

  if (
    requestedFields.length === 0 ||
    requestedFields.some((field) => !allowedFields.includes(field))
  ) {
    throw createError("Invalid or empty staff update.", 400);
  }

  return mongoose.connection.transaction(async (session) => {
    // 1. Load the acting user and their current permissions.
    const actor = await User.findById(actorId)
      .populate({
        path: "roleRef",
        populate: {
          path: "permissions",
          select: "key isActive",
        },
      })
      .session(session);

    if (
      !actor ||
      actor.status !== "ACTIVE" ||
      !actor.roleRef ||
      !actor.roleRef.isActive
    ) {
      throw createError("Active staff account and role are required.", 403);
    }

    const isSuperAdmin = actor.roleRef.name === "SUPER_ADMIN";

    const hasPermission = (permissionKey) =>
      isSuperAdmin ||
      actor.roleRef.permissions?.some(
        (permission) => permission.isActive && permission.key === permissionKey,
      );

    // 2. Check permissions for the requested changes.
    const profileFields = ["username", "firstName", "lastName", "phone"];

    if (
      profileFields.some((field) => requestedFields.includes(field)) &&
      !hasPermission("users:update")
    ) {
      throw createError(
        "You do not have permission to update staff profiles.",
        403,
      );
    }

    if (
      requestedFields.includes("roleId") &&
      !hasPermission("users:change-role")
    ) {
      throw createError(
        "You do not have permission to change staff roles.",
        403,
      );
    }

    if (
      requestedFields.includes("status") &&
      !hasPermission("users:change-status")
    ) {
      throw createError(
        "You do not have permission to change staff status.",
        403,
      );
    }

    // 3. Find the staff member being updated.
    const target = await User.findById(userId).session(session);

    if (!target) {
      throw createError("Staff user not found.", 404);
    }

    const targetRole = await Role.findById(target.roleRef).session(session);

    if (!targetRole || !targetRole.isActive) {
      throw createError("The staff member's role is unavailable.", 409);
    }

    // 4. Protect SUPER_ADMIN accounts.
    if (targetRole.name === "SUPER_ADMIN" && !isSuperAdmin) {
      throw createError(
        "Only a SUPER_ADMIN can modify a SUPER_ADMIN account.",
        403,
      );
    }

    // 5. Prevent users from locking themselves out.
    if (
      String(target._id) === String(actor._id) &&
      (requestedFields.includes("roleId") || requestedFields.includes("status"))
    ) {
      throw createError(
        "You cannot change your own role or account status here.",
        403,
      );
    }

    const changes = {};

    // 6. Update profile fields.
    for (const field of profileFields) {
      if (requestedFields.includes(field) && target[field] !== updates[field]) {
        changes[field] = {
          from: target[field] ?? null,
          to: updates[field],
        };

        target[field] = updates[field];
      }
    }

    // 7. Change the staff member's role.
    if (requestedFields.includes("roleId")) {
      if (!mongoose.isValidObjectId(updates.roleId)) {
        throw createError("Invalid role ID.", 400);
      }

      const newRole = await Role.findById(updates.roleId).session(session);

      if (!newRole || !newRole.isActive) {
        throw createError("The selected role is unavailable.", 400);
      }

      // Never grant SUPER_ADMIN through this endpoint.
      if (newRole.name === "SUPER_ADMIN") {
        throw createError(
          "The SUPER_ADMIN role cannot be assigned through staff updates.",
          403,
        );
      }

      // Only SUPER_ADMIN may assign MANAGER.
      if (newRole.name === "MANAGER" && !isSuperAdmin) {
        throw createError(
          "Only a SUPER_ADMIN can assign the MANAGER role.",
          403,
        );
      }

      // Check whether the actor's staff policy allows this role assignment.
      const staffPolicy = await StaffCreationPolicy.findOne({
        actorRole: actor.roleRef._id,
        isActive: true,
      }).session(session);

      if (!staffPolicy) {
        throw createError(
          "Your role has no active staff-role assignment policy.",
          403,
        );
      }

      const canAssignRole =
        staffPolicy.allowAllActiveRoles ||
        staffPolicy.allowedTargetRoles.some(
          (allowedRoleId) => String(allowedRoleId) === String(newRole._id),
        );

      if (!canAssignRole) {
        throw createError(
          "Your staff-role assignment policy does not allow this role.",
          403,
        );
      }

      // Keep roleRef and the legacy role field synchronized.
      if (String(target.roleRef) !== String(newRole._id)) {
        changes.role = {
          from: targetRole.name,
          to: newRole.name,
        };

        target.roleRef = newRole._id;
        target.role = newRole.name;
      }
    }

    // 8. Change account status.
    if (requestedFields.includes("status")) {
      const newStatus = updates.status;

      if (targetRole.name === "SUPER_ADMIN" && newStatus !== "ACTIVE") {
        throw createError(
          "A SUPER_ADMIN account cannot be deactivated or suspended here.",
          403,
        );
      }

      if (target.status !== newStatus) {
        changes.status = {
          from: target.status,
          to: newStatus,
        };

        target.status = newStatus;
      }
    }

    // 9. Avoid unnecessary database writes and audit events.
    if (Object.keys(changes).length === 0) {
      return target;
    }

    // 10. Save the user.
    await target.save({ session });

    // 11. Record the update in the same transaction.
    await recordAuditEvent({
      actor: actor._id,
      actorRole: actor.roleRef.name,
      action: "users.staff_updated",
      resourceType: "User",
      resourceId: target._id,
      outcome: "SUCCESS",
      requestId,
      details: { changes },
      session,
    });

    return target;
  });
};

export { getUsers, getUserById, createStaff, updateStaff };
