import { Request, Response } from "express";
import * as service from "./material-supplier-ledger.service";

export const getLedger = async (req: Request, res: Response) => {
  try {
    const supplierId = String(req.query.supplierId || "");
    const siteId = String(req.query.siteId || "");

    if (!supplierId) {
      return res.status(400).json({ message: "supplierId required" });
    }

    const data = await service.getLedger(supplierId, siteId || null);
    return res.json({ data });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Failed to load ledger" });
  }
};

export const createBulk = async (req: Request, res: Response) => {
  try {
    const entryDate = String(req.body?.entryDate || "");
    const ledgerId = String(req.body?.ledgerId || "");
    const siteIdRaw = String(req.body?.siteId || "");
    const rowsStr = String(req.body?.rows || "[]");

    if (!entryDate || !ledgerId) {
      return res.status(400).json({ message: "entryDate and ledgerId are required" });
    }

    const rows = JSON.parse(rowsStr);
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: "rows required" });
    }

    const files = (req.files || {}) as Record<string, Express.Multer.File[]>;
    const unloadingFiles = files.unloadingFiles || [];
    const receiptFiles = files.receiptFiles || [];

    if (unloadingFiles.length !== rows.length || receiptFiles.length !== rows.length) {
      return res.status(400).json({ message: "Files count must match rows count" });
    }

    const created = await service.createBulk({
      entryDate,
      ledgerId,
      siteId: siteIdRaw ? siteIdRaw : null,
      rows,
      unloadingFiles,
      receiptFiles,
    });

    return res.status(201).json({
      message: `Saved ${created.count} entries`,
      data: created,
    });
  } catch (e: any) {
    console.error("createBulk error:", e);
    return res.status(400).json({ message: e?.message || "Save failed" });
  }
};

/* ✅ SINGLE UPDATE */
export const updateOne = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "");
    if (!id) return res.status(400).json({ message: "id required" });

    const updated = await service.updateOne(id, req.body || {});
    return res.json({ message: "Updated", data: updated });
  } catch (e: any) {
    console.error("updateOne error:", e);
    // if record not found, service throws
    return res.status(400).json({ message: e?.message || "Update failed" });
  }
};

/* ✅ BULK UPDATE: expects { rows: [{ id, ...fields }] } */
export const bulkUpdate = async (req: Request, res: Response) => {
  try {
    const rows = req.body?.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: "rows array required" });
    }

    const result = await service.bulkUpdate(rows);
    return res.json({ message: `Updated ${result.count} rows`, data: result });
  } catch (e: any) {
    console.error("bulkUpdate error:", e);
    return res.status(400).json({ message: e?.message || "Bulk update failed" });
  }
};

/* ✅ SINGLE DELETE */
export const deleteOne = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "");
    if (!id) return res.status(400).json({ message: "id required" });

    await service.deleteOne(id);
    return res.json({ message: "Deleted" });
  } catch (e: any) {
    console.error("deleteOne error:", e);
    return res.status(400).json({ message: e?.message || "Delete failed" });
  }
};

/* ✅ BULK DELETE: expects { ids: string[] } */
export const bulkDelete = async (req: Request, res: Response) => {
  try {
    const ids = req.body?.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array required" });
    }

    const result = await service.bulkDelete(ids.map(String));
    return res.json({ message: `Deleted ${result.count} rows`, data: result });
  } catch (e: any) {
    console.error("bulkDelete error:", e);
    return res.status(400).json({ message: e?.message || "Bulk delete failed" });
  }
};
