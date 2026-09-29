import User from "../models/User.js";
import { hashPassword, findUserByEmail } from "./auth.service.js";

 const getUsers = async () => {
    return User.find()
        .select("-passwordHash")
        .sort({ createdAt: -1 });
};

 const getUserById = async (userId) => {
    return User.findById(userId)
        .select("-passwordHash");
};
const createStaff = async({
    firstName,
    lastName,
    email,
    phone,
    password,
    role

}) => {
    const normalizedEmail = await email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail
    });
    if (existingUser) {
        const error = new Error("Email is already registered");
        error.statusCode = 409;
        throw error;
    }

   const passwordHash= await hashPassword(password);
    const user = await User.create({
        firstName,
        lastName,
        email: normalizedEmail,
        phone,
        passwordHash,
        role,
        status: "ACTIVE"
    })
    return user;

}
export  {getUsers,getUserById,createStaff}