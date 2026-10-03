import { confirmReservation } from "../services/confirmation.service.js";

export const confirm = async (req, res, next) => {
  try {
    const reservation = await confirmReservation(
      req.params.id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Reservation confirmed successfully",
      data: {
        reservation
      }
    });
  } catch (error) {
    next(error);
  }
};