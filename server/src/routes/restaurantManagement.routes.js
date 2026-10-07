import express from "express";

import {
  createTable,
  getTables,
  updateTable,
  createMenu,
  getMenus,
  updateMenu,
  updateAvailability
} from "../controllers/restaurantManagement.controller.js";
import { validateParams } from "../middleware/validateParams.js";
import {authenticate} from "../middleware/authenticate.js";
import {authorize} from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";

import {
  createRestaurantTableSchema,
  updateRestaurantTableSchema,
  tableParamsSchema,
  createMenuItemSchema,
  updateMenuItemSchema,
  menuItemParamsSchema,
  menuAvailabilitySchema
} from "../utils/validation/restaurant.validation.js";

const router = express.Router();

const managers = authorize(
  "SUPER_ADMIN",
  "MANAGER"
);

router.use(authenticate);
router.use(managers);

router.post(
  "/tables",
  validate(createRestaurantTableSchema),
  createTable
);

router.get(
  "/tables",
  getTables
);

router.patch(
  "/tables/:id",
  validateParams(tableParamsSchema),
  validate(updateRestaurantTableSchema),
  updateTable
);

router.post(
  "/menu-items",
  validate(createMenuItemSchema),
  createMenu
);

router.get(
  "/menu-items",
  getMenus
);

router.patch(
  "/menu-items/:id",
  validateParams(menuItemParamsSchema),
  validate(updateMenuItemSchema),
  updateMenu
);

router.patch(
  "/menu-items/:id/availability",
  validateParams(menuItemParamsSchema),
  validate(menuAvailabilitySchema),
  updateAvailability
);

export default router;