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
    password: Joi.string().required().min(8).max(128) .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
     .messages({
       "string.pattern.base":
         "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
     }),
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
