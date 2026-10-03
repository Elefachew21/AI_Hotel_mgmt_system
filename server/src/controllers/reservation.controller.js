import { createReservation } from "../services/reservation.service.js";

const create = async (req, res, next) => {
    try {
        const reservation = await createReservation(req.body);
        return res.status(201).json({
            success: true,
            message: "Reservation Created Successfully ",
            data: {
                reservation
            }
      })
    } catch (error) {
        next(error);  
    }
}
export {create}