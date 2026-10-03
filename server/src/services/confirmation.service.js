import mongoose from "mongoose";
import Reservation from "../models/Reservation.js";
import Room from "../models/Room.js";

export const confirmReservation = async (reservationId, userId) => {
  const session = await mongoose.startSession();

  try {
    let confirmedReservationId;

    await session.withTransaction(async () => {
      /*
       * 1. Find the reservation inside the transaction.
       */
      const reservation = await Reservation.findById(reservationId)
        .session(session);

      if (!reservation) {
        const error = new Error("Reservation not found");
        error.statusCode = 404;
        throw error;
      }

      /*
       * 2. Only PENDING reservations can be confirmed.
       */
      if (reservation.status !== "PENDING") {
        const error = new Error(
          `Reservation cannot be confirmed from ${reservation.status} status`
        );

        error.statusCode = 409;
        throw error;
      }

      /*
       * 3. Atomically reserve the room.
       *
       * We only accept AVAILABLE here.
       * This prevents two concurrent confirmations
       * from reserving the same room.
       */
      const updatedRoom = await Room.findOneAndUpdate(
        {
          _id: reservation.room,
          isActive: true,
          status: "AVAILABLE"
        },
        {
          $set: {
            status: "RESERVED"
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
          "The assigned room is no longer available for reservation confirmation"
        );

        error.statusCode = 409;
        throw error;
      }

      /*
       * 4. Change reservation state.
       */
      reservation.status = "CONFIRMED";

      await reservation.save({ session });

      confirmedReservationId = reservation._id;
    });

    /*
     * 5. Read the final document after the transaction.
     *
     * This keeps the transaction focused on writes
     * and gives the API a useful populated response.
     */
    return await Reservation.findById(confirmedReservationId)
      .populate("customer")
      .populate("room");
  } finally {
    await session.endSession();
  }
};