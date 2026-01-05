import express from "express";
import {
  getLedgerTypes,
  createLedgerType,
  deleteLedgerType,
  updateLedgerType,
} from "./ledger-type.controller";

const router = express.Router();

router.get("/", getLedgerTypes);
router.post("/", createLedgerType);

// ✅ NEW
router.put("/:id", updateLedgerType);

router.delete("/:id", deleteLedgerType);

export default router;
