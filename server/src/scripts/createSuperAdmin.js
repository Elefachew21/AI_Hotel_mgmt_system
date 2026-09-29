import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import connectDB from "../config/database.js";
import User from "../models/User.js";

dotenv.config();

const createSuperAdmin = async () => {
    try {
        await connectDB();

        const email = process.env.SUPER_ADMIN_EMAIL;
        const password = process.env.SUPER_ADMIN_PASSWORD;

        if (!email || !password) {
            throw new Error(
                "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required"
            );
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (existingUser) {
            console.log("SUPER_ADMIN already exists.");
            process.exit(0);
        }

        const passwordHash = await bcrypt.hash(
            password,
            Number(process.env.BCRYPT_SALT_ROUNDS || 10)
        );

        const user = await User.create({
            firstName: "System",
            lastName: "Administrator",
            email: email.toLowerCase().trim(),
            passwordHash,
            role: "SUPER_ADMIN",
            status: "ACTIVE"
        });

        console.log(`SUPER_ADMIN created: ${user.email}`);

        process.exit(0);
    } catch (error) {
        console.error("Failed to create SUPER_ADMIN:", error);
        process.exit(1);
    }
};

createSuperAdmin();