import express from "express";
import { create, getOne, update, updateStatus, list } from "../controllers/room.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createRoomSchema, updateRoomSchema, updateRoomStatusSchema } from "../utils/validation/room.validation.js";

const router = express.Router();
router.post("/create", authenticate, authorize("SUPER_ADMIN", "MANAGER"), validate(createRoomSchema), create);
router.get("/list", authenticate, authorize("SUPER_ADMIN", "MANAGER", "RECEPTIONIST"), list);
router.get("/:id", authenticate, authorize("SUPER_ADMIN", "MANAGER", "RECEPTIONIST"), getOne);
router.patch("/update/:id", authenticate, authorize("SUPER_ADMIN", "MANAGER"), validate(updateRoomSchema), update);
router.patch("/updatestatus/:id", authenticate, authorize("SUPER_ADMIN", "MANAGER"), validate(updateRoomStatusSchema), updateStatus);
export default router;