import { Router } from "express";
import multer from "multer";
import {
  createBulkFuelLedger,
  deleteFuelLedgerRow,
  getFuelLedger,
  updateFuelLedgerRow,
} from "./fuel-station-ledger.controller";

const router = Router();

/**
 * ✅ Needed because bulk endpoint is hit using FormData (multipart/form-data)
 * and we are not uploading files. express.json/urlencoded will NOT parse multipart.
 */
const upload = multer(); // memory storage (no files)

/**
 * GET  /api/fuel-station-ledger?fuelStationId=&siteId=
 * POST /api/fuel-station-ledger/bulk   (FormData: fuelStationId, siteId, entryDate?, rows JSON)
 * PUT  /api/fuel-station-ledger/:id
 * DELETE /api/fuel-station-ledger/:id
 */
router.get("/", getFuelLedger);

// ✅ Bulk create (multipart form-data without files)
router.post("/bulk", upload.none(), createBulkFuelLedger);

// ✅ Update one row (JSON)
router.put("/:id", updateFuelLedgerRow);

// ✅ Delete one row (hard delete preference)
router.delete("/:id", deleteFuelLedgerRow);

export default router;
