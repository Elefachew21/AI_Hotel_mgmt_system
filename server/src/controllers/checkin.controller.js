import { checkInReservation } from "../services/checkin.service.js";

 const checkIn = async (req, res, next) => {
    try {
        const reservation = await checkInReservation(
            req.params.id,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            message: "Guest checked in successfully",
            data: {
                reservation
            }
        });
    } catch (error) {
        next(error);
    }
};
export{checkIn}