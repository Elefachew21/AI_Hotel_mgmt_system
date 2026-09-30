import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createCustomerSchema, updateCustomerSchema } from "../utils/validation/customer.validation.js";
import { getOne,list,update,create } from "../controllers/customer.controller.js";

const router = express.Router();
router.post("/", authenticate, authorize("SUPER_ADMIN", "MANAGER", "RECEPTIONIST"), validate(createCustomerSchema), create);
router.get("/", authenticate, authorize("SUPER_ADMIN", "MANAGER", "RECEPTIONIST"), list);
router.get("/:id", authenticate, authorize("SUPER_ADMIN", "MANAGER", "RECEPTIONIST"), getOne);
router.patch("/:id", authenticate, authorize("SUPER_ADMIN", "MANAGER", "RECEPTIONIST"), validate(updateCustomerSchema), update);

export default router;