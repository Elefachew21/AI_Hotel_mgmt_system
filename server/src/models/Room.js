import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
    {
        roomNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        roomType: {
            type: String,
            required: true,
            trim: true
        },

        floor: {
            type: Number,
            required: true,
            min: 0
        },

        capacity: {
            type: Number,
            required: true,
            min: 1
        },

        pricePerNight: {
            type: Number,
            required: true,
            min: 0
        },

        status: {
            type: String,
            required: true,
            enum: [
                "AVAILABLE",
                "OCCUPIED",
                "RESERVED",
                "DIRTY",
                "CLEANING",
                "OUT_OF_SERVICE"
            ],
            default: "AVAILABLE"
        },
        assignedHousekeeper: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
  index: true
},

        description: {
            type: String,
            trim: true
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Room", roomSchema);