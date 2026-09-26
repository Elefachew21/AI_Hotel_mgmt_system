import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true
        },

        lastName: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        phone: {
            type: String,
            trim: true
        },

        passwordHash: {
            type: String,
            required: true,
            select: false
        },

        role: {
            type: String,
            required: true,
            enum: [
                "SUPER_ADMIN",
                "MANAGER",
                "RECEPTIONIST",
                "CASHIER",
                "KITCHEN_STAFF",
                "INVENTORY_OFFICER",
                "HOUSEKEEPER",
                "MAINTENANCE_TECH",
                "GUEST"
            ]
        },

        status: {
            type: String,
            required: true,
            enum: [
                "ACTIVE",
                "INACTIVE",
                "SUSPENDED"
            ],
            default: "ACTIVE"
        },

        lastLoginAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("User", userSchema);