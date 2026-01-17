import { Router } from "express";
import multer from "multer";
import {
  createBulkFuelLedger,
  deleteFuelLedgerRow,
  getFuelLedger,
  updateFuelLedgerRow,
} from "./fuel-station-ledger.controller";

const router = Router();
const upload = multer(); // memory, for form-data (no files)

router.get("/", getFuelLedger);
router.post("/bulk", upload.none(), createBulkFuelLedger);
router.put("/:id", updateFuelLedgerRow);
router.delete("/:id", deleteFuelLedgerRow);

export default router;
