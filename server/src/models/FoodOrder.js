import mongoose from "mongoose";

const foodOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantTable",
      required: true,
      index: true
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderSession",
      required: true,
      index: true
    },

    folio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folio",
      default: null,
      index: true
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "PREPARING",
        "READY",
        "COMPLETED",
        "CANCELLED"
      ],
      default: "PENDING",
      index: true
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    customerNotes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null
    }
  },
  {
    timestamps: true
  }
);

foodOrderSchema.index({ table: 1, createdAt: -1 });
foodOrderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("FoodOrder", foodOrderSchema);