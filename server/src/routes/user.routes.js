import express from "express";

import {
  listUsers,
  getUser,
  createStaffUser,
} from "../controllers/user.controller.js";

import { authenticate } from "../middleware/authenticate.js";
import { authorizePermission } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createStaffSchema } from "../utils/validation/auth.validation.js";

const router = express.Router();
router.post(
  "/",
  authenticate,
  authorizePermission("users:create-staff"),
  validate(createStaffSchema),
  createStaffUser,
);
router.get("/", authenticate, authorizePermission("users:read"), listUsers);
router.get("/:id", authenticate, authorizePermission("users:read"), getUser);

export default router;
