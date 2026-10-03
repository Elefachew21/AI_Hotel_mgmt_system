import joi from "joi";

const createReservationSchema = joi.object({
    
    customerId: joi.string()
        .hex()
        .length(24)
        .required(),
    roomId: joi.string()
        .hex()
        .length(24)
        .required(),
    checkInDate: joi.date()
        .iso()
        .required(),
    checkOutDate: joi.date()
        .iso()
        .required()
    ,
    numberOfGuests: joi.number()
        .integer()
        .min(1)
        .required(),
    specialRequests: joi.string()
        .trim()
        .max(1000)
    .optional()
})
export {
    createReservationSchema
}