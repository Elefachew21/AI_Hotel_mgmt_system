import Joi from "joi";
const registerSchema = Joi.object({
  firstName: Joi.string().required().trim().min(2).max(50),
  lastName: Joi.string().required().trim().min(2).max(50),
  email: Joi.string().email().required().trim().lowercase(),
  phone: Joi.string().optional().trim().min(7).max(20),
  password: Joi.string()
    .required()
    .min(8)
    .max(128)
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    )
    .messages({
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
});

const createStaffSchema = Joi.object({
  username: Joi.string().trim().min(2).max(50).optional(),

  firstName: Joi.string().trim().min(2).max(50).required(),

  lastName: Joi.string().trim().min(2).max(50).required(),

  email: Joi.string().lowercase().trim().email().required(),

  phone: Joi.string().trim().min(7).max(20).optional(),

  password: Joi.string().min(8).max(128).required(),

  roleId: Joi.string().hex().length(24).required(),
});

const updateStaffSchema = Joi.object({
  username: Joi.string().trim().min(2).max(50),

  firstName: Joi.string().trim().min(2).max(50),

  lastName: Joi.string().trim().min(2).max(50),

  phone: Joi.string().trim().min(7).max(20).allow(""),

  roleId: Joi.string().hex().length(24),

  status: Joi.string().valid("ACTIVE", "INACTIVE", "SUSPENDED"),
})
  .min(1)
  .unknown(false);

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
}).unknown(false);

const resetPasswordSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  code: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.pattern.base": "Verification code must contain six digits.",
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain uppercase, lowercase, number, and special character.",
    }),
}).unknown(false);
const verifyEmailSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  code: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.pattern.base": "Verification code must contain six digits.",
    }),
}).unknown(false);

const resendVerificationSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
}).unknown(false);

export {
  registerSchema,
  loginSchema,
  createStaffSchema,
  updateStaffSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
};
