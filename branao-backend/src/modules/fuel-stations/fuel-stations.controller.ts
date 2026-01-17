import { Request, Response } from "express";
import prisma from "../../lib/prisma";

export const getFuelStations = async (_req: Request, res: Response) => {
  try {
    const list = await prisma.fuelStation.findMany({
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: list });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message || "Failed" });
  }
};

export const createFuelStation = async (req: Request, res: Response) => {
  try {
    const { name, contactNo, address } = req.body || {};
    if (!String(name || "").trim()) {
      return res.status(400).json({ success: false, message: "Name required" });
    }

    const created = await prisma.fuelStation.create({
      data: {
        name: String(name).trim(),
        contactNo: contactNo ? String(contactNo).trim() : null,
        address: address ? String(address).trim() : null,
      },
    });

    res.status(201).json({ success: true, data: created });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message || "Failed" });
  }
};

export const updateFuelStation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contactNo, address } = req.body || {};

    const updated = await prisma.fuelStation.update({
      where: { id },
      data: {
        name: name != null ? String(name).trim() : undefined,
        contactNo: contactNo != null ? String(contactNo).trim() : undefined,
        address: address != null ? String(address).trim() : undefined,
      },
    });

    res.json({ success: true, data: updated });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message || "Failed" });
  }
};

export const deleteFuelStation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.fuelStation.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message || "Failed" });
  }
};
