import express from "express";

import {
    listUsers,
    getUser,createStaffUser
} from "../controllers/user.controller.js";

import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createStaffSchema } from "../utils/validation/auth.validation.js";
import { create } from "framer-motion/m";

const router = express.Router();
router.post("/", authenticate, authorize("SUPER_ADMIN"), validate(createStaffSchema), createStaffUser);
router.get( "/",  authenticate,  authorize("SUPER_ADMIN"),listUsers);
router.get("/:id", authenticate, authorize("SUPER_ADMIN"), getUser);




export default router;