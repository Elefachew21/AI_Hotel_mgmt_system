import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const privateKeyPath = path.resolve(
    __dirname,
    "../../keys/private.pem"
);

const publicKeyPath = path.resolve(
    __dirname,
    "../../keys/public.pem"
);

const privateKey = fs.readFileSync(privateKeyPath, "utf8");
const publicKey = fs.readFileSync(publicKeyPath, "utf8");

 const generateAccessToken = (user) => {
    return jwt.sign(
        {
            sub: user._id.toString(),
            role: user.role
        },
        privateKey,
        {
            algorithm: "RS256",
            expiresIn: "15m",
            issuer: "getheva-api",
            audience: "getheva-client"
        }
    );
};

 const verifyAccessToken = (token) => {
    return jwt.verify(token, publicKey, {
        algorithms: ["RS256"],
        issuer: "getheva-api",
        audience: "getheva-client"
    });
};

export { verifyAccessToken, generateAccessToken };