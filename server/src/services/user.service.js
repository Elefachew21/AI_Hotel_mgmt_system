import User from "../models/User.js";
import Role from "../models/Role.js";
import { hashPassword } from "./auth.service.js";
import StaffCreationPolicy from "../models/StaffCreationPolicy.js";
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
}) => {
  // 1. Load the creator and their current role.
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
    const error = new Error("An active user with an active role is required");
    error.statusCode = 403;
    throw error;
  }

  const isSuperAdmin = actor.roleRef.name === "SUPER_ADMIN";

  // 2. Non-Super-Admins must have the staff-creation permission.
  const hasCreatePermission = actor.roleRef.permissions.some(
    (permission) =>
      permission.isActive && permission.key === "users:create-staff",
  );

  if (!isSuperAdmin && !hasCreatePermission) {
    const error = new Error("You are not authorized to create staff accounts");
    error.statusCode = 403;
    throw error;
  }

  // 3. Require an active policy for the creator's role.
  const policy = await StaffCreationPolicy.findOne({
    actorRole: actor.roleRef._id,
    isActive: true,
  });

  if (!policy) {
    const error = new Error(
      "No active staff-creation policy exists for your role",
    );
    error.statusCode = 403;
    throw error;
  }

  // 4. Load the selected target role.
  const targetRole = await Role.findById(roleId);

  if (!targetRole || !targetRole.isActive) {
    const error = new Error("Selected role does not exist or is inactive");
    error.statusCode = 400;
    throw error;
  }

  // 5. Enforce permanent role-hierarchy restrictions.
  if (targetRole.name === "SUPER_ADMIN") {
    const error = new Error(
      "Super Admin accounts cannot be created through staff creation",
    );
    error.statusCode = 403;
    throw error;
  }

  if (!isSuperAdmin && targetRole.name === "MANAGER") {
    const error = new Error("Only a Super Admin can create a Manager account");
    error.statusCode = 403;
    throw error;
  }

  // 6. Check the database policy.
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

  // 7. Check for duplicate email.
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  // 8. Hash the password and create the account.
  const passwordHash = await hashPassword(password);

  const user = await User.create({
    username,
    firstName,
    lastName,
    email: normalizedEmail,
    phone,
    passwordHash,
    role: targetRole.name,
    roleRef: targetRole._id,
    status: "ACTIVE",
  });

  return user;
};

export { getUsers, getUserById, createStaff };
