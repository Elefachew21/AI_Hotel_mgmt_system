import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
            index: true
        },

        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true,
            index: true
        },

        checkInDate: {
            type: Date,
            required: true
        },

        checkOutDate: {
            type: Date,
            required: true
        },

        // Actual check-in event



        checkedInAt: {
    type: Date,
    default: null
            },

checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
},

checkedOutAt: {
    type: Date,
    default: null
},

checkedOutBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
},
        numberOfGuests: {
            type: Number,
            required: true,
            min: 1
        },

        pricePerNight: {
            type: Number,
            required: true,
            min: 0
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        status: {
            type: String,
            required: true,
            enum: [
                "PENDING",
                "CONFIRMED",
                "CANCELLED",
                "CHECKED_IN",
                "CHECKED_OUT"
            ],
            default: "PENDING",
            index: true
        },

        specialRequests: {
            type: String,
            trim: true,
            maxlength: 1000
        }
    },
    {
        timestamps: true
    }
);

reservationSchema.index({
    room: 1,
    checkInDate: 1,
    checkOutDate: 1,
    status: 1
});

export default mongoose.model("Reservation", reservationSchema);