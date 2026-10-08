import express from "express";
import { create, getOne, update, updateStatus, list,assignHousekeeperToRoom } from "../controllers/room.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createRoomSchema,assignHousekeeperSchema, updateRoomSchema, updateRoomStatusSchema } from "../utils/validation/room.validation.js";
import { confirm } from "../controllers/confirmation.controller.js";
import { validateParams } from "../middleware/validateParams.js";

const router = express.Router();
router.post("/create", authenticate, authorize("SUPER_ADMIN", "MANAGER"), validate(createRoomSchema), create);
router.get("/list", authenticate, authorize("SUPER_ADMIN", "MANAGER", "RECEPTIONIST"), list);
router.get("/:id", authenticate, authorize("SUPER_ADMIN", "MANAGER", "RECEPTIONIST"), getOne);
router.patch("/:id", authenticate, authorize("SUPER_ADMIN", "MANAGER"), validate(updateRoomSchema), update);
router.patch("/status/:id", authenticate, authorize("SUPER_ADMIN", "MANAGER"), validate(updateRoomStatusSchema), updateStatus);
router.patch(
    "/:id/housekeeper",
    authenticate,
    authorize("SUPER_ADMIN", "MANAGER"),
    validate(assignHousekeeperSchema),
    assignHousekeeperToRoom
);export default router;