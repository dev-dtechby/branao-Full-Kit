import { Request, Response } from "express";
import * as service from "./site-transaction.service";

/**
 * NOTE:
 * Base route in app.ts:
 * app.use("/api/site-transactions", siteTransactionRoutes);
 *
 * So endpoints become:
 * GET    /api/site-transactions
 * GET    /api/site-transactions/deleted
 * GET    /api/site-transactions/site/:siteId
 * POST   /api/site-transactions
 * PUT    /api/site-transactions/:id
 * DELETE /api/site-transactions/:id
 * POST   /api/site-transactions/:id/restore
 * DELETE /api/site-transactions/:id/hard
 */

/* =========================
   GET ACTIVE
   query: siteId, from, to, source, nature
========================= */
export const getAllActive = async (req: Request, res: Response) => {
  try {
    const { siteId, from, to, source, nature } = req.query as Record<string, any>;

    const data = await service.getAllActiveTransactions({
      siteId: siteId || undefined,
      from: from || undefined,
      to: to || undefined,
      source: source || undefined,
      nature: nature || undefined,
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err: any) {
    console.error("❌ SiteTxn getAllActive:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to fetch transactions",
    });
  }
};

/* =========================
   GET DELETED
   query: siteId, from, to, source, nature
========================= */
export const getAllDeleted = async (req: Request, res: Response) => {
  try {
    const { siteId, from, to, source, nature } = req.query as Record<string, any>;

    const data = await service.getDeletedTransactions({
      siteId: siteId || undefined,
      from: from || undefined,
      to: to || undefined,
      source: source || undefined,
      nature: nature || undefined,
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err: any) {
    console.error("❌ SiteTxn getAllDeleted:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to fetch deleted transactions",
    });
  }
};

/* =========================
   GET BY SITE
   query: from, to, source, nature
========================= */
export const getBySite = async (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    const { from, to, source, nature } = req.query as Record<string, any>;

    if (!siteId) {
      return res.status(400).json({
        success: false,
        message: "siteId is required",
      });
    }

    const data = await service.getTransactionsBySite(siteId, {
      from: from || undefined,
      to: to || undefined,
      source: source || undefined,
      nature: nature || undefined,
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err: any) {
    console.error("❌ SiteTxn getBySite:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to fetch site transactions",
    });
  }
};

/* =========================
   CREATE (manual/admin)
========================= */
export const create = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || "SYSTEM";
    const ip = req.ip;

    const created = await service.createSiteTransaction(req.body, userId, ip);

    return res.status(201).json({
      success: true,
      message: "Transaction created",
      data: created,
    });
  } catch (err: any) {
    console.error("❌ SiteTxn create:", err);
    return res.status(400).json({
      success: false,
      message: err?.message || "Create failed",
    });
  }
};

/* =========================
   UPDATE
========================= */
export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "id is required" });
    }

    const userId = (req as any).user?.id || "SYSTEM";
    const ip = req.ip;

    const updated = await service.updateSiteTransaction(id, req.body, userId, ip);

    return res.status(200).json({
      success: true,
      message: "Transaction updated",
      data: updated,
    });
  } catch (err: any) {
    console.error("❌ SiteTxn update:", err);
    return res.status(400).json({
      success: false,
      message: err?.message || "Update failed",
    });
  }
};

/* =========================
   SOFT DELETE
========================= */
export const softDelete = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "id is required" });
    }

    const userId = (req as any).user?.id || "SYSTEM";
    const ip = req.ip;

    await service.softDeleteSiteTransaction(id, userId, ip);

    return res.status(200).json({
      success: true,
      message: "Transaction moved to deleted records",
    });
  } catch (err: any) {
    console.error("❌ SiteTxn softDelete:", err);
    return res.status(400).json({
      success: false,
      message: err?.message || "Delete failed",
    });
  }
};

/* =========================
   RESTORE
========================= */
export const restore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "id is required" });
    }

    const userId = (req as any).user?.id || "SYSTEM";
    const ip = req.ip;

    await service.restoreSiteTransaction(id, userId, ip);

    return res.status(200).json({
      success: true,
      message: "Transaction restored",
    });
  } catch (err: any) {
    console.error("❌ SiteTxn restore:", err);
    return res.status(400).json({
      success: false,
      message: err?.message || "Restore failed",
    });
  }
};

/* =========================
   HARD DELETE
========================= */
export const hardDelete = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "id is required" });
    }

    const userId = (req as any).user?.id || "SYSTEM";
    const ip = req.ip;

    await service.hardDeleteSiteTransaction(id, userId, ip);

    return res.status(200).json({
      success: true,
      message: "Transaction permanently deleted",
    });
  } catch (err: any) {
    console.error("❌ SiteTxn hardDelete:", err);
    return res.status(400).json({
      success: false,
      message: err?.message || "Hard delete failed",
    });
  }
};
