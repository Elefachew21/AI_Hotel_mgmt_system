import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorizePermission } from "../middleware/authorize.js";
import {
  createRoleController,
  listRolesController,
  getRoleController,
  updateRolePermissionsController,
  updateRoleStatusController,
} from "../controllers/role.controller.js";

import { saveDelegationPolicyController } from "../controllers/delegationPolicy.controller.js";

const router = express.Router();
router.post(
  "/",
  authenticate,
  authorizePermission("roles:create"),
  createRoleController,
);

// Replace the permission assignments for an existing role.
router.patch(
  "/:id/permissions",
  authenticate,
  authorizePermission("roles:update"),
  updateRolePermissionsController,
);

router.put(
  "/delegation-policies",
  authenticate,
  authorizePermission("roles:manage-permissions"),
  saveDelegationPolicyController,
);

router.get(
  "/",
  authenticate,
  authorizePermission("roles:read"),
  listRolesController,
);

router.get(
  "/:id",
  authenticate,
  authorizePermission("roles:read"),
  getRoleController,
);

router.patch(
  "/:id/status",
  authenticate,
  authorizePermission("roles:update"),
  updateRoleStatusController,
);

export default router;
