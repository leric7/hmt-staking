import express from "express";

import * as protocolController from "../controllers/protocol.controller";
import * as authMiddleware from "../middleware/auth.middleware";

const router = express.Router();

// Stake
router.post(
  "/stake",
  authMiddleware.authorizeOperator,
  protocolController.stake
);

// Escrow
router.post("/escrow", protocolController.escrow);

export { router as default };
