import mongoose from "mongoose";
import Folio from "../models/Folio.js";
import FolioItem from "../models/FolioItem.js";
import Payment from "../models/Payment.js";
import Reservation from "../models/Reservation.js";

 const createFolioForReservation = async (
  reservationId,
  userId,
  session = null
) => {
  const reservation = await Reservation.findById(reservationId)
    .session(session);

  if (!reservation) {
    const error = new Error("Reservation not found");
    error.statusCode = 404;
    throw error;
  }

  const existingFolio = await Folio.findOne({
    reservation: reservationId
  }).session(session);

  if (existingFolio) {
    return existingFolio;
  }

  const [folio] = await Folio.create(
    [
      {
        reservation: reservation._id,
        customer: reservation.customer,
        status: "OPEN"
      }
    ],
    { session }
  );

  return folio;
};

 const getFolioTotals = async (folioId) => {
  const [chargeResult, paymentResult] = await Promise.all([
    FolioItem.aggregate([
      {
        $match: {
          folio: new mongoose.Types.ObjectId(folioId)
        }
      },
      {
        $group: {
          _id: null,
          totalCharges: {
            $sum: "$total"
          }
        }
      }
    ]),

    Payment.aggregate([
      {
        $match: {
          folio: new mongoose.Types.ObjectId(folioId),
          status: "COMPLETED"
        }
      },
      {
        $group: {
          _id: null,
          totalPaid: {
            $sum: "$amount"
          }
        }
      }
    ])
  ]);
 
   
   
  const totalCharges = chargeResult[0]?.totalCharges || 0;
  const totalPaid = paymentResult[0]?.totalPaid || 0;

  const balanceDue = totalCharges - totalPaid;

  return {
    totalCharges,
    totalPaid,
    balanceDue: Math.max(balanceDue, 0),
    overpaidAmount: Math.max(-balanceDue, 0)
  };
};
 const addRoomCharge = async (
  reservationId,
  userId,
  session = null
) => {
  const reservation = await Reservation.findById(reservationId)
    .session(session);

  if (!reservation) {
    const error = new Error("Reservation not found");
    error.statusCode = 404;
    throw error;
  }

  const folio = await createFolioForReservation(
    reservationId,
    userId,
    session
  );

  const existingRoomCharge = await FolioItem.findOne({
    folio: folio._id,
    type: "ROOM",
    sourceType: "ROOM"
  }).session(session);

  if (existingRoomCharge) {
    return existingRoomCharge;
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  const nights = Math.ceil(
    (reservation.checkOutDate - reservation.checkInDate) /
      millisecondsPerDay
  );

  const total = nights * reservation.pricePerNight;

  const [folioItem] = await FolioItem.create(
    [
      {
        folio: folio._id,
        type: "ROOM",
        description: `Room charge for ${nights} night(s)`,
        quantity: nights,
        unitPrice: reservation.pricePerNight,
        total,
        sourceType: "ROOM",
        sourceId: reservation.room,
        createdBy: userId
      }
    ],
    { session }
  );

  return folioItem;
};
 const getFolioByReservation = async (reservationId) => {
  const folio = await Folio.findOne({
    reservation: reservationId
  })
    .populate({
      path: "reservation",
      populate: [
        { path: "customer" },
        { path: "room" }
      ]
    })
    .populate("customer")
    .lean();

  if (!folio) {
    const error = new Error("Folio not found for this reservation");
    error.statusCode = 404;
    throw error;
  }

  const [items, payments, totals] = await Promise.all([
    FolioItem.find({ folio: folio._id })
      .populate("createdBy", "firstName lastName role")
      .sort({ createdAt: 1 })
      .lean(),

    Payment.find({ folio: folio._id })
      .populate("receivedBy", "firstName lastName role")
      .sort({ createdAt: 1 })
      .lean(),

    getFolioTotals(folio._id)
  ]);

  return {
    folio,
    items,
    payments,
    totals
  };
};
 const closeFolio = async (folioId, userId) => {
  const folio = await Folio.findById(folioId);

  if (!folio) {
    const error = new Error("Folio not found");
    error.statusCode = 404;
    throw error;
  }

  if (folio.status !== "OPEN") {
    const error = new Error(
      `Folio cannot be closed from ${folio.status} status`
    );

    error.statusCode = 409;
    throw error;
  }

  const totals = await getFolioTotals(folioId);

  if (totals.balanceDue > 0) {
    const error = new Error(
      `Cannot close folio. Outstanding balance is ${totals.balanceDue}`
    );

    error.statusCode = 409;
    throw error;
  }

  folio.status = "CLOSED";
  folio.closedAt = new Date();
  folio.closedBy = userId;

  await folio.save();

  return folio;
};
export { createFolioForReservation, getFolioTotals, addRoomCharge, getFolioByReservation, closeFolio };