import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import {
  getLedger,
  createBulk,
  updateOne,
  bulkUpdate,
  deleteOne,
  bulkDelete,
} from "./material-supplier-ledger.controller";

const router = Router();

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

/* GET ledger */
router.get("/", getLedger);

/* BULK CREATE (multipart) */
router.post(
  "/bulk",
  upload.fields([
    { name: "unloadingFiles", maxCount: 50 },
    { name: "receiptFiles", maxCount: 50 },
  ]),
  createBulk
);

/* ✅ BULK UPDATE (JSON) - keep ABOVE "/:id" */
router.put("/bulk-update", bulkUpdate);

/* ✅ BULK DELETE (JSON) - keep ABOVE "/:id" */
router.post("/bulk-delete", bulkDelete);

/* SINGLE UPDATE (JSON) */
router.put("/:id", updateOne);

/* SINGLE DELETE */
router.delete("/:id", deleteOne);

export default router;
