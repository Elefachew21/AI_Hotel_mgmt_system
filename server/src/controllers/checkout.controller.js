import { checkOutReservation } from "../services/checkout.service.js";
const checkOut = async (req, res, next) =>
{
    try {
        const reservation = await checkOutReservation(req.params.id, req.user.id);
        return res.status(200).json({
            success: true,
            message: "Guest CheckedOut Successfully",
            data: {
                reservation
            }
        })
        
    } catch (error) {
        next(error);
    }
}
export {checkOut}