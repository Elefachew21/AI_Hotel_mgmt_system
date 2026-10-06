import mongoose from "mongoose";
const folioSchema = mongoose.Schema({
    reservation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reservation",
        required: true,
        unique: true,
        index:true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
        index:true
    },
    status: {
        type: String,
        enum: ["OPEN", "CLOSE", "VOID"],
        default: "OPEN",
        index:true
    
    },
     closedAt: {
      type: Date,
      default: null
    },

    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true
    })
export default mongoose.model("Folio", folioSchema);