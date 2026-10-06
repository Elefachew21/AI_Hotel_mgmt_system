import Joi from "joi";

export const reservationFolioParamsSchema = Joi.object({
  reservationId: Joi.string()
    .hex()
    .length(24)
    .required()
});
export const folioParamsSchema = Joi.object({
  id: Joi.string()
    .hex()
    .length(24)
    .required()
});