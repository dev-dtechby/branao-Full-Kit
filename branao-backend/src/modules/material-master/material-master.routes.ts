import express from "express";
import {
  getMaterialMaster,
  getDeletedMaterialMaster,
  createMaterialMaster,
  updateMaterialMaster,
  deleteMaterialMaster,
  restoreMaterialMaster,
  hardDeleteMaterialMaster,
} from "./material-master.controller";

const router = express.Router();

router.get("/", getMaterialMaster);
router.get("/deleted", getDeletedMaterialMaster);

router.post("/", createMaterialMaster);
router.put("/:id", updateMaterialMaster);

router.delete("/:id", deleteMaterialMaster);        // soft delete
router.post("/:id/restore", restoreMaterialMaster); // restore
router.delete("/:id/hard", hardDeleteMaterialMaster);

export default router;
