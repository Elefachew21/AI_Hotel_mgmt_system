import mongoose from "mongoose";

const restaurantTableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 50
    },

    publicToken: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    capacity: {
      type: Number,
      required: true,
      min: 1
    },

    status: {
      type: String,
      enum: ["AVAILABLE", "OCCUPIED", "OUT_OF_SERVICE"],
      default: "AVAILABLE",
      index: true
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("RestaurantTable", restaurantTableSchema);