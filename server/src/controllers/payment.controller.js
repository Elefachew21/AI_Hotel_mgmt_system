import { recordPayment } from "../services/payment.service.js";
import { getFolioTotals } from "../services/folio.service.js";

export const createPayment = async (req, res, next) => {
  try {
    const payment = await recordPayment({
      ...req.body,
      userId: req.user.id
    });

    const totals = await getFolioTotals(payment.folio);

    return res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: {
        payment,
        totals
      }
    });
  } catch (error) {
    next(error);
  }
};