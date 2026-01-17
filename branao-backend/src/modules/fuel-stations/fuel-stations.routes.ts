import { Router } from "express";
import { getFuelStations } from "./fuel-stations.controller";

const router = Router();

// GET /api/fuel-stations?q=...
router.get("/", getFuelStations);

export default router;
