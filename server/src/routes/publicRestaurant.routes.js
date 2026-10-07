import express from "express";

import {
  getPublicTable,
  getPublicMenu,
  startOrderSession,
  submitFoodOrder
} from "../controllers/publicRestaurant.controller.js";

import { validate } from "../middleware/validate.js";

import {
  tableTokenParamsSchema,
  createOrderSessionSchema,
  createFoodOrderSchema
} from "../utils/validation/restaurant.validation.js";

const router = express.Router();

router.get(
  "/tables/:token",
  validate(tableTokenParamsSchema, "params"),
  getPublicTable
);

router.get(
  "/menu",
  getPublicMenu
);

router.post(
  "/order-sessions",
  validate(createOrderSessionSchema),
  startOrderSession
);

router.post(
  "/orders",
  validate(createFoodOrderSchema),
  submitFoodOrder
);

export default router;