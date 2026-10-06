import mongoose from "mongoose";

const orderSessionSchema = new mongoose.Schema(
  {
    sessionToken: {
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

    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "EXPIRED"],
      default: "ACTIVE",
      index: true
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

orderSessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 } // it is important for removing expired session automatically from the database
);

export default mongoose.model("OrderSession", orderSessionSchema);