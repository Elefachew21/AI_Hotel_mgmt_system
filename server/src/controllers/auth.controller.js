import { createUser,findUserByEmail,comparePassword } from "../services/auth.service.js";
import { generateAccessToken } from "../services/token.service.js";
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
        const { email, password } = req.body;
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalide Email Or Password"
            });
        }
        if (user.status !== "ACTIVE") {
            return res.status(403).json({
                success: false,
                message: "Account is not Active"
            });
        }
        const passwordMatches = await comparePassword(password, user.passwordHash);
        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalide Email or Password"
            });

        }
        user.lastLoginAt = new Date();
        await user.save();
        const accessToken = generateAccessToken(user);
        res.status(200).json({
            success: true,
            message: "Login Successful !",
            data: {
                accessToken,
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    status: user.status
                }
            }
        });


       
    }
    catch(error) {
        next(error);
    }
}


export  { register, login };