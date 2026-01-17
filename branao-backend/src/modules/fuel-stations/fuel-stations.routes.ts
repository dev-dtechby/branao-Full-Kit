import { Router } from "express";
import {
  createFuelStation,
  deleteFuelStation,
  getFuelStations,
  updateFuelStation,
} from "./fuel-stations.controller";

const router = Router();

router.get("/", getFuelStations);
router.post("/", createFuelStation);
router.put("/:id", updateFuelStation);
router.delete("/:id", deleteFuelStation);

export default router;
