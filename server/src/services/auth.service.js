import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";
import Role from "../models/Role.js";
dotenv.config();
const hashPassword = async (password) => {
  return await bcrypt.hash(
    password,
    Number(process.env.BCRYPT_SALT_ROUNDS || 12),
  );
};
const comparePassword = async (password, passwordHash) => {
  return await bcrypt.compare(password, passwordHash);
};
const findUserByEmail = async (email) => {
  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  }).select("+passwordHash tokenVersion status emailVerified");

  return user;
};
const createUser = async ({ firstName, lastName, email, phone, password }) => {
  const existingUser = await User.findOne({
    email: email.toLowerCase().trim(),
  });
  if (existingUser) {
    const error = new Error("Email is al're'ady Registered");
    error.statusCode = 409;
    throw error;
  }
  const guestRole = await Role.findOne({
    name: "GUEST",
    isActive: true,
  }).select("_id");
  if (!guestRole) {
    const error = new Error(
      "Active Guest role not Found. Please seed the rolea first",
    );
    error.statusCode = 500;
    throw error;
  }
  const passwordHash = await hashPassword(password);
  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    passwordHash,
    role: "GUEST", // the client does not decide the role it is one part of the security boundary,
    roleRef: guestRole._id,
  });
  return user;
};
export { hashPassword, comparePassword, findUserByEmail, createUser };
