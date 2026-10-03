import Joi from "joi";

export const confirmReservationParamsSchema = Joi.object({
  id: Joi.string().hex().length(24).required()
});