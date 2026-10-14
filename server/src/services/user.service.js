
import User from "../models/User.js";
import Role from "../models/Role.js";
import { hashPassword } from "./auth.service.js";

const getUsers = async () => {
  return User.find()
    .select("-passwordHash")
    .sort({ createdAt: -1 });
};

const getUserById = async (userId) => {
  return User.findById(userId)
    .select("-passwordHash");
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
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  // Verify the person creating the account using current DB data.
  const actor = await User.findById(actorId)
    .select("status roleRef")
    .populate({
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
    const error = new Error(
      "Only an active Super Admin can create staff accounts"
    );
    error.statusCode = 403;
    throw error;
  }

  // Resolve the submitted ID to a real, active Role document.
  const targetRole = await Role.findById(roleId);

  if (!targetRole || !targetRole.isActive) {
    const error = new Error(
      "Selected role does not exist or is inactive"
    );
    error.statusCode = 400;
    throw error;
  }

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