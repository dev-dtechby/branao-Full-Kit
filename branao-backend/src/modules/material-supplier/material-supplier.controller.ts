import { Request, Response } from "express";
import { materialSupplierService } from "./material-supplier.service";

export const getMaterialSuppliers = async (req: Request, res: Response) => {
  try {
    const data = await materialSupplierService.getActive();
    return res.json({ data });
  } catch {
    return res.status(500).json({ message: "Failed to load suppliers" });
  }
};

export const getDeletedMaterialSuppliers = async (req: Request, res: Response) => {
  try {
    const data = await materialSupplierService.getDeleted();
    return res.json({ data });
  } catch {
    return res.status(500).json({ message: "Failed to load deleted suppliers" });
  }
};

export const createMaterialSupplier = async (req: Request, res: Response) => {
  try {
    const name = String(req.body?.name || "").trim();
    const contactNo = String(req.body?.contactNo || "").trim();
    const address = String(req.body?.address || "").trim();

    if (!name) return res.status(400).json({ message: "Supplier name required" });

    const created = await materialSupplierService.create({
      name,
      contactNo: contactNo || undefined,
      address: address || undefined,
    });

    return res.status(201).json({ message: "Supplier added", data: created });
  } catch (e: any) {
    return res.status(400).json({ message: e?.message || "Create failed" });
  }
};

export const updateMaterialSupplier = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const name = String(req.body?.name || "").trim();
    const contactNo = String(req.body?.contactNo || "").trim();
    const address = String(req.body?.address || "").trim();

    if (!name) return res.status(400).json({ message: "Supplier name required" });

    const updated = await materialSupplierService.update(id, {
      name,
      contactNo: contactNo || undefined,
      address: address || undefined,
    });

    return res.json({ message: "Supplier updated", data: updated });
  } catch (e: any) {
    return res.status(400).json({ message: e?.message || "Update failed" });
  }
};

export const deleteMaterialSupplier = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const deletedBy = (req.body?.deletedBy as string) || null;

    await materialSupplierService.softDelete(id, deletedBy);
    return res.json({ message: "Supplier deleted (soft)" });
  } catch {
    return res.status(400).json({ message: "Delete failed" });
  }
};

export const restoreMaterialSupplier = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await materialSupplierService.restore(id);
    return res.json({ message: "Supplier restored" });
  } catch {
    return res.status(400).json({ message: "Restore failed" });
  }
};

export const hardDeleteMaterialSupplier = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await materialSupplierService.hardDelete(id);
    return res.json({ message: "Supplier deleted permanently" });
  } catch {
    return res.status(400).json({ message: "Hard delete failed" });
  }
};
