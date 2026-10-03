export const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: "Invalid request parameters",
                errors: error.details.map((detail) => detail.message)
            });
        }

        req.params = value;

        next();
    };
};