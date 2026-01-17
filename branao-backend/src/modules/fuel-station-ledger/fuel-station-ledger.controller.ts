import { Request, Response } from "express";
import {
  createBulk,
  deleteOne,
  getLedger,
  updateOne,
} from "./fuel-station-ledger.service";

export const getFuelLedger = async (req: Request, res: Response) => {
  try {
    const { fuelStationId, siteId } = req.query as any;
    const data = await getLedger({
      fuelStationId: fuelStationId ? String(fuelStationId) : undefined,
      siteId: siteId ? String(siteId) : undefined,
    });
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message || "Failed" });
  }
};

export const createBulkFuelLedger = async (req: Request, res: Response) => {
  try {
    const fuelStationId = String(req.body?.fuelStationId || "");
    const siteId = String(req.body?.siteId || "");
    const entryDate = String(req.body?.entryDate || "");
    const rowsRaw = req.body?.rows;

    if (!fuelStationId || !siteId) {
      return res
        .status(400)
        .json({ success: false, message: "fuelStationId and siteId required" });
    }

    const rows = typeof rowsRaw === "string" ? JSON.parse(rowsRaw) : rowsRaw;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: "rows required" });
    }

    const result = await createBulk({
      fuelStationId,
      siteId,
      entryDate,
      rows,
    });

    res.status(201).json({
      success: true,
      message: `Saved ${result.count} rows`,
      data: result.data,
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message || "Failed" });
  }
};

export const updateFuelLedgerRow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await updateOne(id, req.body || {});
    res.json({ success: true, data: updated });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message || "Failed" });
  }
};

export const deleteFuelLedgerRow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteOne(id);
    res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message || "Failed" });
  }
};
