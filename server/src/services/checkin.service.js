import mongoose from "mongoose";
import Reservation from "../models/Reservation.js";
import Room from "../models/Room.js";
import { createFolioForReservation, addRoomCharge } from "./folio.service.js";
export const checkInReservation = async (reservationId, userId) => {
    const session = await mongoose.startSession();

    try {
        let checkedInReservationId;

        await session.withTransaction(async () => {
            /*
             * Find the reservation inside the transaction.
             */
            const reservation = await Reservation.findById(
                reservationId
            ).session(session);

            if (!reservation) {
                const error = new Error("Reservation not found");
                error.statusCode = 404;
                throw error;
            }

            /*
             * Check-in is a valid transition only from
             * CONFIRMED → CHECKED_IN.
             */
            if (reservation.status !== "CONFIRMED") {
                const error = new Error(
                    `Reservation cannot be checked in from ${reservation.status} status`
                );

                error.statusCode = 409;
                throw error;
            }

            /*
             * Atomically claim the room.
             *
             * The update only succeeds when the room is still
             * active and operational.
             */
            const updatedRoom = await Room.findOneAndUpdate(
                {
                    _id: reservation.room,
                    isActive: true,
                    status: "RESERVED"
                    
                },
                {
                    $set: {
                        status: "OCCUPIED"
                    }
                },
                {
                    new: true,
                    session
                }
            );

            if (!updatedRoom) {
                /*
                 * We don't expose unnecessary internal details.
                 * The important business fact is that the room
                 * cannot currently be occupied.
                 */
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
                    "The assigned room is not available for check-in"
                );

                error.statusCode = 409;
                throw error;
            }

            /*
             * Room has successfully been claimed.
             *
             * Now record the actual check-in event.
             */
            if (reservation.status !== "CONFIRMED") {
  const error = new Error(
    `Reservation cannot be checked in from ${reservation.status} status`
  );

  error.statusCode = 409;
  throw error;
}
            reservation.status = "CHECKED_IN";
            reservation.checkedInAt = new Date();
            reservation.checkedInBy = userId;

            await reservation.save({
                session
            });
            await createFolioForReservation(
  reservation._id,
  userId,
  session
);

await addRoomCharge(
  reservation._id,
  userId,
  session
);

            checkedInReservationId = reservation._id;
        });

        /*
         * Transaction committed successfully.
         *
         * Fetch the final representation after commit.
         */
        const updatedReservation = await Reservation.findById(
            checkedInReservationId
        )
            .populate("customer")
            .populate("room")
            .populate(
                "checkedInBy",
                "firstName lastName email role"
            );

        return updatedReservation;

    } finally {
        await session.endSession();
    }
};