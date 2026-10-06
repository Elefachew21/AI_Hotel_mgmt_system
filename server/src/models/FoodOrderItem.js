import mongoose from "mongoose";

const foodOrderItemSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodOrder",
      required: true,
      index: true
    },

    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },

    total: {
      type: Number,
      required: true,
      min: 0
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null
    }
  },
  {
    timestamps: true
  }
);

foodOrderItemSchema.index({ order: 1, createdAt: 1 });

export default mongoose.model("FoodOrderItem", foodOrderItemSchema);