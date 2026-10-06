import mongoose from "mongoose";

const folioItemSchema = new mongoose.Schema(
  {
    folio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folio",
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: [
        "ROOM",
        "FOOD",
        "MINIBAR",
        "SERVICE",
        "OTHER"
      ],
      required: true,
      index: true
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },

    quantity: {
      type: Number,
      required: true,
      min: 0.01
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

    sourceType: {
      type: String,
      enum: [
        "ROOM",
        "RESTAURANT_ORDER",
        "MINIBAR",
        "MANUAL",
        "OTHER"
      ],
      required: true
    },

    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true
  }
);

folioItemSchema.index({
  folio: 1,
  createdAt: -1
});

export default mongoose.model("FolioItem", folioItemSchema);