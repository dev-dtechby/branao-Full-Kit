import { Request, Response } from "express";
import { materialMasterService } from "./material-master.service";

export const getMaterialMaster = async (req: Request, res: Response) => {
  try {
    const data = await materialMasterService.getActive();
    return res.json({ data });
  } catch {
    return res.status(500).json({ message: "Failed to load materials" });
  }
};

export const getDeletedMaterialMaster = async (req: Request, res: Response) => {
  try {
    const data = await materialMasterService.getDeleted();
    return res.json({ data });
  } catch {
    return res.status(500).json({ message: "Failed to load deleted materials" });
  }
};

export const createMaterialMaster = async (req: Request, res: Response) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ message: "Material name required" });

    const created = await materialMasterService.create(name);
    return res.status(201).json({ message: "Material added", data: created });
  } catch (e: any) {
    return res.status(400).json({ message: e?.message || "Create failed" });
  }
};

export const updateMaterialMaster = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ message: "Material name required" });

    const updated = await materialMasterService.update(id, name);
    return res.json({ message: "Material updated", data: updated });
  } catch (e: any) {
    return res.status(400).json({ message: e?.message || "Update failed" });
  }
};

export const deleteMaterialMaster = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const deletedBy = (req.body?.deletedBy as string) || null;

    await materialMasterService.softDelete(id, deletedBy);
    return res.json({ message: "Material deleted (soft)" });
  } catch {
    return res.status(400).json({ message: "Delete failed" });
  }
};

export const restoreMaterialMaster = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await materialMasterService.restore(id);
    return res.json({ message: "Material restored" });
  } catch {
    return res.status(400).json({ message: "Restore failed" });
  }
};

export const hardDeleteMaterialMaster = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await materialMasterService.hardDelete(id);
    return res.json({ message: "Material deleted permanently" });
  } catch {
    return res.status(400).json({ message: "Hard delete failed" });
  }
};
