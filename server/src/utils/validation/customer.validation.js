import Joi from "joi";

export const createCustomerSchema = Joi.object({
    firstName: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .required(),

    lastName: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .required(),

    email: Joi.string()
        .trim()
        .lowercase()
        .email()
        .optional(),

    phone: Joi.string()
        .trim()
        .min(7)
        .max(20)
        .optional(),

    identificationType: Joi.string()
        .trim()
        .max(50)
        .optional(),

    identificationNumber: Joi.string()
        .trim()
        .max(100)
        .optional(),

    nationality: Joi.string()
        .trim()
        .max(50)
        .optional(),

    address: Joi.string()
        .trim()
        .max(255)
        .optional()
});

export const updateCustomerSchema = createCustomerSchema.fork(
    [
        "firstName",
        "lastName"
    ],
    (schema) => schema.optional()
);