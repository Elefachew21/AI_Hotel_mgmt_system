import Joi from "joi";

export const createKotSchema = Joi.object({
  foodOrderId: Joi.string()
    .hex()
    .length(24)
    .required()
});

export const kotParamsSchema = Joi.object({
  id: Joi.string()
    .hex()
    .length(24)
    .required()
});

export const kotStatusQuerySchema = Joi.object({
  status: Joi.string()
    .valid(
      "PENDING",
      "COOKING",
      "READY",
      "CANCELLED"
    )
    .optional()
});