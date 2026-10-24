import express from "express";
import {
  savePolicy,
  listPolicies,
} from "../controllers/staffCreationPolicy.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

// Super Admin authorization is verified inside the policy service.
router.get("/", authenticate, listPolicies);
router.put("/", authenticate, savePolicy);

export default router;
