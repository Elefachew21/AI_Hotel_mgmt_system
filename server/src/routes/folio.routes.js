import express from "express";

import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validateParams } from "../middleware/validateParams.js";

import { getFolio } from "../controllers/folio.controller.js";

import { close } from "../controllers/folio.controller.js";

import {
  folioParamsSchema,
  reservationFolioParamsSchema
} from "../utils/validation/folio.validation.js";
const router = express.Router();

router.get(
  "/reservation/:reservationId",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "MANAGER",
    "RECEPTIONIST",
    "CASHIER"
  ),
  validateParams(reservationFolioParamsSchema),
  getFolio
);

router.post(
  "/:id/close",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "MANAGER",
    "CASHIER"
  ),
  validateParams(folioParamsSchema),
  close
);

export default router;