import { Router } from "express";
import multer from "multer";
import path from "path";
import * as c from "./labour-contractor-ledger.controller";

const router = Router();

/* ===== multer (agreement upload) ===== */
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(process.cwd(), "uploads")),
    filename: (_req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
  }),
});

/* =========================================================
   CONTRACTOR (MASTER)
========================================================= */
router.get("/contractors", c.listContractors);
router.post("/contractors", c.createContractor);
router.put("/contractors/:id", c.updateContractor);
router.delete("/contractors/:id", c.deleteContractorHard); // HARD DELETE

/* =========================================================
   CONTRACTS (SITE DEALS + AGREEMENT)
========================================================= */
router.get("/contracts", c.listContracts); // ?contractorId=&siteId=
router.post(
  "/contracts",
  upload.single("agreement"),
  c.createContract
);
router.put(
  "/contracts/:id",
  upload.single("agreement"),
  c.updateContract
);
router.delete("/contracts/:id", c.deleteContractHard);

/* =========================================================
   PAYMENTS (WEEKLY)
========================================================= */
router.get("/payments", c.listPayments); // ?contractorId=&siteId=&from=&to=
router.post("/payments", c.createPayment);
router.put("/payments/:id", c.updatePayment);
router.delete("/payments/:id", c.deletePaymentHard);

/* =========================================================
   LEDGER SUMMARY (contract + paid + balance)
========================================================= */
router.get("/ledger/:contractorId", c.getContractorLedger); // ?siteId=

export default router;
