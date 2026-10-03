import mongoose from "mongoose";
import Reservation from "../models/Reservation.js";
import Room from "../models/Room.js";

export const checkOutReservation = async (reservationId, userId) => {
  const session = await mongoose.startSession();

  try {
    let checkedOutReservationId;

    await session.withTransaction(async () => {
      const reservation = await Reservation.findById(reservationId)
        .session(session);

      if (!reservation) {
        const error = new Error("Reservation not found");
        error.statusCode = 404;
        throw error;
      }

      if (reservation.status !== "CHECKED_IN") {
        const error = new Error(
          `Reservation cannot be checked out from ${reservation.status} status`
        );

        error.statusCode = 409;
        throw error;
      }

      /*
       * Checkout makes the room dirty.
       *
       * It must currently be OCCUPIED.
       */
      const updatedRoom = await Room.findOneAndUpdate(
        {
          _id: reservation.room,
          isActive: true,
          status: "OCCUPIED"
        },
        {
          $set: {
            status: "DIRTY"
          }
        },
        {
          new: true,
          session
        }
      );

      if (!updatedRoom) {
        const roomExists = await Room.exists({
          _id: reservation.room
        }).session(session);

        if (!roomExists) {
          const error = new Error(
            "The room assigned to this reservation was not found"
          );

          error.statusCode = 404;
          throw error;
        }

        const error = new Error(
          "The assigned room is not currently occupied"
        );

        error.statusCode = 409;
        throw error;
      }

      reservation.status = "CHECKED_OUT";
      reservation.checkedOutAt = new Date();
      reservation.checkedOutBy = userId;

      await reservation.save({ session });

      checkedOutReservationId = reservation._id;
    });

    return await Reservation.findById(checkedOutReservationId)
      .populate("customer")
      .populate("room")
      .populate("checkedInBy", "firstName lastName email role")
      .populate("checkedOutBy", "firstName lastName email role");
  } finally {
    await session.endSession();
  }
};