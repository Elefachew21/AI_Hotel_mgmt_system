import Joi from "joi";

export const createRoomSchema = Joi.object({
    roomNumber: Joi.string()
        .trim()
        .max(20)
        .required(),

    roomType: Joi.string()
        .trim()
        .max(50)
        .required(),

    floor: Joi.number()
        .integer()
        .min(0)
        .required(),

    capacity: Joi.number()
        .integer()
        .min(1)
        .required(),

    pricePerNight: Joi.number()
        .min(0)
        .required(),

    description: Joi.string()
        .trim()
        .max(500)
        .optional()
});

export const updateRoomSchema = createRoomSchema.fork(
    [
        "roomNumber",
        "roomType",
        "floor",
        "capacity",
        "pricePerNight",
        "description"
    ],
    (schema) => schema.optional()
);

export const updateRoomStatusSchema = Joi.object({
    status: Joi.string()
        .valid(
            "AVAILABLE",
            "OCCUPIED",
            "RESERVED",
            "DIRTY",
            "CLEANING",
            "OUT_OF_SERVICE"
        )
        .required()
});
export const assignHousekeeperSchema = Joi.object({

    housekeeperId: Joi.string()
    .hex()
        .length(24)
        .allow(null)
    .required()
})