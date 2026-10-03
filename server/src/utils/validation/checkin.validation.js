import Joi from "joi";

export const checkInParamsSchema = Joi.object({
    id: Joi.string()
        .hex()
        .length(24)
        .required()
});