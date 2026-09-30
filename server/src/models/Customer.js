import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
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
            trim: true,
            lowercase: true
        },

        phone: {
            type: String,
            trim: true
        },

        identificationType: {
            type: String,
            trim: true
        },

        identificationNumber: {
            type: String,
            trim: true
        },

        nationality: {
            type: String,
            trim: true
        },

        address: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Customer", customerSchema);