import { Request, Response } from "express";
import prisma from "../../lib/prisma";

/**
 * Fuel Stations are fetched from Ledger table itself (NO separate FuelStation model).
 * We filter by ledgerType name OR ledger name containing common fuel words.
 *
 * API:
 *  GET /api/fuel-stations
 *  GET /api/fuel-stations?q=vaishnav
 */
export const getFuelStations = async (req: Request, res: Response) => {
  try {
    const q = String(req.query?.q || "").trim();

    // If you ever want to see deleted too (optional)
    const includeDeleted = String(req.query?.includeDeleted || "false") === "true";

    const where: any = {
      ...(includeDeleted ? {} : { isDeleted: false }),
      OR: [
        // 1) ledgerType based match (best)
        {
          ledgerType: {
            name: { contains: "fuel", mode: "insensitive" },
          },
        },
        {
          ledgerType: {
            name: { contains: "station", mode: "insensitive" },
          },
        },
        // 2) name based fallback match
        { name: { contains: "fuel", mode: "insensitive" } },
        { name: { contains: "pump", mode: "insensitive" } },
        { name: { contains: "petrol", mode: "insensitive" } },
        { name: { contains: "diesel", mode: "insensitive" } },
      ],
    };

    // Optional search query (q) → filter further
    if (q) {
      where.AND = [
        {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { mobile: { contains: q, mode: "insensitive" } },
            { address: { contains: q, mode: "insensitive" } },
            { ledgerType: { name: { contains: q, mode: "insensitive" } } },
          ],
        },
      ];
    }

    const list = await prisma.ledger.findMany({
      where,
      select: {
        id: true,
        name: true,
        mobile: true,
        address: true,
        ledgerType: { select: { id: true, name: true } },
        isDeleted: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    // Standardize output for frontend dropdown
    const data = (list || []).map((x) => ({
      id: x.id,
      name: x.name,
      mobile: x.mobile ?? null,
      address: x.address ?? null,
      ledgerType: x.ledgerType ? { name: x.ledgerType.name } : null,
      isDeleted: x.isDeleted ?? false,
      createdAt: x.createdAt,
    }));

    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("❌ getFuelStations error:", e);
    return res.status(500).json({
      success: false,
      message: e?.message || "Failed to load fuel stations",
    });
  }
};
