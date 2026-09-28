import { createUser } from "../services/auth.service.js";
const register = async (req, res, next) => {
    try {
        // the registration logic go here
        const user = await createUser(req.body);
        res.status(201).json({
            success: true,
            message: "Registration successful !!!",
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    status: user.status,
                    createdAt: user.createdAt
                }
            }
        });

    }
    catch (error) {
        next(error);
    }
}
const login = async (req, res, next) => {
    try {
        // the login logic go here
        res.status(501).json({
            success: false,
            message: "Login not implemented yet"
        });
    }
    catch(error) {
        next(error);
    }
}


export  { register, login };