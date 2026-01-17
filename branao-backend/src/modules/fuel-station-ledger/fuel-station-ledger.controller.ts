import { Request, Response } from "express";
import { createBulk, deleteOne, getLedger, updateOne } from "./fuel-station-ledger.service";

const safeJsonParse = (v: any) => {
  if (v == null) return null;
  if (typeof v === "object") return v;
  if (typeof v !== "string") return null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
};

const normPurchaseType = (v: any) => {
  const s = String(v || "").trim().toUpperCase();
  if (s === "OWN" || s === "OWN_VEHICLE") return "OWN_VEHICLE";
  if (s === "RENT" || s === "RENT_VEHICLE") return "RENT_VEHICLE";
  return s; // service will validate final
};

const n = (v: any) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : v; // keep raw if not number; service validates
};

export const getFuelLedger = async (req: Request, res: Response) => {
  try {
    const { ledgerId, fuelStationId, siteId } = req.query as any;

    // ✅ backward compatible: fuelStationId -> ledgerId
    const lid = String(ledgerId || fuelStationId || "").trim() || undefined;
    const sid = String(siteId || "").trim() || undefined;

    const data = await getLedger({
      ledgerId: lid,
      siteId: sid,
    });

    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(500).json({
      success: false,
      message: e?.message || "Failed",
    });
  }
};

export const createBulkFuelLedger = async (req: Request, res: Response) => {
  try {
    // ✅ For multipart/form-data (FormData), req.body fields are strings (multer().none()).
    // ✅ Accept both ledgerId and fuelStationId for backward compatibility.
    const ledgerId = String(req.body?.ledgerId || req.body?.fuelStationId || "").trim();
    const siteId = String(req.body?.siteId || "").trim();
    const entryDate = String(req.body?.entryDate || "").trim();
    const rowsRaw = req.body?.rows;

    if (!ledgerId || !siteId) {
      return res.status(400).json({
        success: false,
        message: "ledgerId and siteId required",
      });
    }

    const rowsParsed = safeJsonParse(rowsRaw);
    const rows = Array.isArray(rowsParsed)
      ? rowsParsed
      : Array.isArray(rowsRaw)
      ? rowsRaw
      : [];

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "rows required",
      });
    }

    // ✅ normalize row fields lightly (service does strict validation)
    const cleanedRows = rows.map((r: any) => ({
      ...r,
      entryDate: r?.entryDate ? String(r.entryDate) : undefined,
      through: r?.through != null ? String(r.through) : null,
      purchaseType: normPurchaseType(r?.purchaseType),
      vehicleNumber: r?.vehicleNumber != null ? String(r.vehicleNumber) : "",
      vehicleName: r?.vehicleName != null ? String(r.vehicleName) : null,
      fuelType: r?.fuelType != null ? String(r.fuelType) : "",
      qty: n(r?.qty),
      rate: n(r?.rate),
      slipNo: r?.slipNo != null ? String(r.slipNo) : null,
      remarks: r?.remarks != null ? String(r.remarks) : null,
    }));

    const result = await createBulk({
      ledgerId,
      siteId,
      entryDate: entryDate || undefined,
      rows: cleanedRows,
    });

    return res.status(201).json({
      success: true,
      message: `Saved ${result.count} rows`,
      data: result.data,
    });
  } catch (e: any) {
    return res.status(500).json({
      success: false,
      message: e?.message || "Failed",
    });
  }
};

export const updateFuelLedgerRow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "id required" });
    }

    const patch: any = req.body || {};

    // optional normalize
    if (patch.purchaseType != null) patch.purchaseType = normPurchaseType(patch.purchaseType);

    const updated = await updateOne(id, patch);
    return res.json({ success: true, data: updated });
  } catch (e: any) {
    return res.status(500).json({
      success: false,
      message: e?.message || "Failed",
    });
  }
};

export const deleteFuelLedgerRow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "id required" });
    }

    await deleteOne(id);
    return res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    return res.status(500).json({
      success: false,
      message: e?.message || "Failed",
    });
  }
};
