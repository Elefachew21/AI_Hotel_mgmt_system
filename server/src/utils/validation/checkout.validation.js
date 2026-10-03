import joi from "joi";
const checkOutParamsSchema = joi.object({
    id: joi.string()
        .hex()
        .length(24)
        .required()
})
 export {checkOutParamsSchema}