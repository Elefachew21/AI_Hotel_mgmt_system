import Joi from "joi";
import joi from "joi";
const registerSchema = joi.object({
    
    firstName: joi.string().required().trim().min(2).max(50),
    lastName: joi.string().required().trim().min(2).max(50),
    email: joi.string().email().required().trim().lowercase(),
    phone: joi.string().optional().trim().min(7).max(20),
    password: joi.string().required().min(8).max(128) .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
  .messages({
    "string.pattern.base":
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  }),
})

const loginSchema = joi.object({
  email: joi.string()
    .trim()
    .lowercase()
    .email()
    .required(),
  password: joi.string()
    .required()
});
const createStaffSchema = joi.object({
  firstName: joi.string()
    .trim()
    .min(2)
    .max(50)
    .required(),
  lastName: joi.string()
    .trim()
    .min(2)
    .max(50)
    .required(),
  email: joi.string()
    .lowercase()
    .trim()
    .required()
    .email(),
  phone: joi.string()
    .trim()
    .min(7)
    .max(20)
    .optional(),
  password: joi.string()
    .min(8)
    .max(128)
    .required(),
  role: joi.string()
    .valid(
     "MANAGER",
            "RECEPTIONIST",
            "CASHIER",
            "KITCHEN_STAFF",
            "INVENTORY_OFFICER",
            "HOUSEKEEPER",
            "MAINTENANCE_TECH"
  )
  .required()
})
export {registerSchema,loginSchema,createStaffSchema}