import express from "express";
import { login, register } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { registerSchema } from "../utils/validation/auth.validation.js";
const router = express.Router();
router.post("/register", validate(registerSchema), register);

router.post("/login", login);
export default router;