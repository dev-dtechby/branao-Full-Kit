import { Request, Response } from "express";
import prisma from "../../lib/prisma";

const normalizeName = (v: any) => String(v || "").trim().toUpperCase();

/* ================= GET ================= */
export const getLedgerTypes = async (_req: Request, res: Response) => {
  try {
    const data = await prisma.ledgerType.findMany({
      where: { isDeleted: false },
      orderBy: { name: "asc" },
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error("GET LEDGER TYPES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ledger types",
    });
  }
};

/* ================= CREATE ================= */
export const createLedgerType = async (req: Request, res: Response) => {
  try {
    const name = normalizeName(req.body?.name);

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Ledger Type name is required",
      });
    }

    // ✅ find by name (includes deleted too)
    const existingAny = await prisma.ledgerType.findFirst({
      where: { name },
      select: { id: true, isDeleted: true },
    });

    // If exists and active => duplicate
    if (existingAny && existingAny.isDeleted === false) {
      return res.status(400).json({
        success: false,
        message: "Ledger Type already exists",
      });
    }

    // If exists but deleted => restore
    if (existingAny && existingAny.isDeleted === true) {
      const data = await prisma.ledgerType.update({
        where: { id: existingAny.id },
        data: {
          name,
          isDeleted: false,
          deletedAt: null,
        },
      });

      return res.status(200).json({
        success: true,
        data,
        message: "Ledger Type restored",
      });
    }

    // else create new
    const data = await prisma.ledgerType.create({
      data: { name },
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    console.error("CREATE LEDGER TYPE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Ledger Type create failed",
    });
  }
};

/* ================= UPDATE (NEW) ================= */
export const updateLedgerType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const name = normalizeName(req.body?.name);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Ledger Type id is required",
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Ledger Type name is required",
      });
    }

    // ✅ must exist & active
    const current = await prisma.ledgerType.findFirst({
      where: { id, isDeleted: false },
      select: { id: true },
    });

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Ledger Type not found",
      });
    }

    // ✅ prevent duplicate names with other active records
    const duplicate = await prisma.ledgerType.findFirst({
      where: {
        id: { not: id },
        isDeleted: false,
        name,
      },
      select: { id: true },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Ledger Type already exists",
      });
    }

    const data = await prisma.ledgerType.update({
      where: { id },
      data: { name },
    });

    return res.status(200).json({
      success: true,
      data,
      message: "Ledger Type updated successfully",
    });
  } catch (error) {
    console.error("UPDATE LEDGER TYPE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Ledger Type update failed",
    });
  }
};

/* ================= DELETE (SOFT) ================= */
export const deleteLedgerType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Ledger Type id is required",
      });
    }

    await prisma.ledgerType.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("DELETE LEDGER TYPE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Ledger Type delete failed",
    });
  }
};
