import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null
    },

    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    imageUrl: {
      type: String,
      trim: true,
      default: null
    },

    isAvailable: {
      type: Boolean,
      default: true,
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

menuItemSchema.index({
  category: 1,
  isAvailable: 1,
  isActive: 1
});

export default mongoose.model("MenuItem", menuItemSchema);