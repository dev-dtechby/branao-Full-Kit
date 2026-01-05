import express from "express";
import {
  createLedger,
  getLedgers,
  deleteLedger,
  getLedgerById,
  updateLedger,
} from "./ledger.controller";

const router = express.Router();

router.get("/", getLedgers);

// ✅ NEW
router.get("/:id", getLedgerById);
router.put("/:id", updateLedger);

router.post("/", createLedger);
router.delete("/:id", deleteLedger);

export default router;
