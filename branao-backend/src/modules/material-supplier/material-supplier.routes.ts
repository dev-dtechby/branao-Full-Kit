import express from "express";
import {
  getMaterialSuppliers,
  getDeletedMaterialSuppliers,
  createMaterialSupplier,
  updateMaterialSupplier,
  deleteMaterialSupplier,
  restoreMaterialSupplier,
  hardDeleteMaterialSupplier,
} from "./material-supplier.controller";

const router = express.Router();

router.get("/", getMaterialSuppliers);
router.get("/deleted", getDeletedMaterialSuppliers);

router.post("/", createMaterialSupplier);
router.put("/:id", updateMaterialSupplier);

router.delete("/:id", deleteMaterialSupplier);        // soft delete
router.post("/:id/restore", restoreMaterialSupplier); // restore
router.delete("/:id/hard", hardDeleteMaterialSupplier);

export default router;
