import mongoose from "mongoose";

const kitchenOrderTicketSchema = new mongoose.Schema(
  {
    kotNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    foodOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodOrder",
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

    status: {
      type: String,
      enum: ["PENDING", "COOKING", "READY", "CANCELLED"],
      default: "PENDING",
      index: true
    },

    startedAt: {
      type: Date,
      default: null
    },

    readyAt: {
      type: Date,
      default: null
    },

    cancelledAt: {
      type: Date,
      default: null
    },

    startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true
  }
);

kitchenOrderTicketSchema.index({
  status: 1,
  createdAt: 1
});

export default mongoose.model(
  "KitchenOrderTicket",
  kitchenOrderTicketSchema
);