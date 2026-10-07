import { verifyAccessToken } from "../services/token.service.js";

 const authenticate = (req, res, next) => {
    try {
        const authorization = req.headers.authorization;

        if (!authorization) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const [scheme, token] = authorization.split(" ");

        if (scheme !== "Bearer" || !token) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication format"
            });
        }

        const payload = verifyAccessToken(token);

        req.user = {
            id: payload.sub,
            role: payload.role
        };

        next();
    } catch (error) {
       
    return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
    });
}
    
};
export  {authenticate};