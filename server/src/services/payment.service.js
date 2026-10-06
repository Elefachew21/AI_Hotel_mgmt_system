import Payment from "../models/Payment.js";
import Folio from "../models/Folio.js";
import { getFolioTotals } from "./folio.service.js";

export const recordPayment = async ({
  folioId,
  amount,
  method,
  transactionReference,
  notes,
  userId
}) => {
  const folio = await Folio.findById(folioId);

  if (!folio) {
    const error = new Error("Folio not found");
    error.statusCode = 404;
    throw error;
  }

  if (folio.status !== "OPEN") {
    const error = new Error("Cannot record payment on a closed folio");
    error.statusCode = 409;
    throw error;
  }

  const totals = await getFolioTotals(folioId);

  if (amount > totals.balanceDue) {
    const error = new Error(
      `Payment exceeds the outstanding balance of ${totals.balanceDue}`
    );

    error.statusCode = 400;
    throw error;
  }

  const payment = await Payment.create({
    folio: folioId,
    amount,
    method,
    transactionReference,
    notes,
    receivedBy: userId,
    status: "COMPLETED"
  });

  return payment;
};