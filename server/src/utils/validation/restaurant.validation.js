import Joi from "joi";

export const createRestaurantTableSchema = Joi.object({
  tableNumber: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required(),

  capacity: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .required()
});

export const updateRestaurantTableSchema = Joi.object({
  tableNumber: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .optional(),

  capacity: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .optional(),

  status: Joi.string()
    .valid(
      "AVAILABLE",
      "OCCUPIED",
      "OUT_OF_SERVICE"
    )
    .optional(),

  isActive: Joi.boolean()
    .optional()
}).min(1);

export const tableParamsSchema = Joi.object({
  id: Joi.string()
    .hex()
    .length(24)
    .required()
});

export const tableTokenParamsSchema = Joi.object({
  token: Joi.string()
    .trim()
    .min(20)
    .max(200)
    .required()
});

export const createOrderSessionSchema = Joi.object({
  tableToken: Joi.string()
    .trim()
    .min(20)
    .max(200)
    .required()
});

export const createMenuItemSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(150)
    .required(),

  description: Joi.string()
    .trim()
    .max(500)
    .optional(),

  category: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required(),

  price: Joi.number()
    .min(0)
    .precision(2)
    .required(),

  imageUrl: Joi.string()
    .uri()
    .max(500)
    .optional()
});

export const updateMenuItemSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(150)
    .optional(),

  description: Joi.string()
    .trim()
    .max(500)
    .allow(null)
    .optional(),

  category: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional(),

  price: Joi.number()
    .min(0)
    .precision(2)
    .optional(),

  imageUrl: Joi.string()
    .uri()
    .max(500)
    .allow(null)
    .optional(),

  isAvailable: Joi.boolean()
    .optional(),

  isActive: Joi.boolean()
    .optional()
}).min(1);

export const menuItemParamsSchema = Joi.object({
  id: Joi.string()
    .hex()
    .length(24)
    .required()
});

export const menuAvailabilitySchema = Joi.object({
  isAvailable: Joi.boolean()
    .required()
});

export const createFoodOrderSchema = Joi.object({
  sessionToken: Joi.string()
    .trim()
    .min(20)
    .max(200)
    .required(),

  items: Joi.array()
    .items(
      Joi.object({
        menuItemId: Joi.string()
          .hex()
          .length(24)
          .required(),

        quantity: Joi.number()
          .integer()
          .min(1)
          .max(50)
          .required(),

        notes: Joi.string()
          .trim()
          .max(300)
          .optional()
      })
    )
    .min(1)
    .max(50)
    .required(),

  customerNotes: Joi.string()
    .trim()
    .max(500)
    .optional()
});