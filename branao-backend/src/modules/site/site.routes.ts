import { Router } from "express";
import SiteController from "./site.controller";

const router = Router();

// Create Site
router.post("/", SiteController.createSite);

// Get All Sites
router.get("/", SiteController.getSites);

// Get Single Site
router.get("/:id", SiteController.getSiteById);

// Update Site
router.put("/:id", SiteController.updateSite);

// Delete Site (Soft Delete)
router.delete("/:id", SiteController.removeSite);

export default router;
