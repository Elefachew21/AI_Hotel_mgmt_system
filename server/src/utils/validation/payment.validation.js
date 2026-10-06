import Joi from "joi";

export const createPaymentSchema = Joi.object({
  folioId: Joi.string()
    .hex()
    .length(24)
    .required(),

  amount: Joi.number()
    .positive()
    .precision(2)
    .required(),

  method: Joi.string()
    .valid(
      "CASH",
      "CARD",
      "TELEBIRR",
      "CHAPA",
      "BANK_TRANSFER",
      "OTHER"
    )
    .required(),

  transactionReference: Joi.string()
    .trim()
    .max(200)
    .optional(),

  notes: Joi.string()
    .trim()
    .max(500)
    .optional()
});