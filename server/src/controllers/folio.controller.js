import {
  getFolioByReservation,closeFolio
} from "../services/folio.service.js";

export const getFolio = async (req, res, next) => {
  try {
    const result = await getFolioByReservation(
      req.params.reservationId
    );

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
export const close = async (req, res, next) => {
  try {
    const folio = await closeFolio(
      req.params.id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Folio closed successfully",
      data: {
        folio
      }
    });
  } catch (error) {
    next(error);
  }
};