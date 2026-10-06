import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    folio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folio",
      required: true,
      index: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01
    },

    method: {
      type: String,
      enum: [
        "CASH",
        "CARD",
        "TELEBIRR",
        "CHAPA",
        "BANK_TRANSFER",
        "OTHER"
      ],
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "COMPLETED",
        "FAILED",
        "REFUNDED"
      ],
      default: "COMPLETED",
      index: true
    },

    transactionReference: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null
    },

    paidAt: {
      type: Date,
      default: Date.now
    },

    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    notes: {
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

paymentSchema.index({
  folio: 1,
  createdAt: -1
});

paymentSchema.index({
  transactionReference: 1
});

export default mongoose.model("Payment", paymentSchema);