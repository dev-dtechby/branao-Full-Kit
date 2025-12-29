import { Router } from "express";
import prisma from "../../lib/prisma";
import upload from "../../utils/upload";
import {
  createSiteHandler,
  getSiteByIdHandler,
  updateSiteHandler,
} from "./site.controller";

const router = Router();

/* =====================================================
   GET ALL SITES  ✅ (LIST VIEW)
===================================================== */
router.get("/", async (_req, res) => {
  try {
    const sites = await prisma.site.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      include: {
        department: {
          select: { id: true, name: true },
        },
        estimate: true,     // ✅ ONE-TO-ONE
        documents: true,    // ✅ ONE-TO-MANY
      },
    });

    const formattedSites = sites.map((site) => {
      const getSingleDoc = (type: "SD" | "WORK_ORDER") =>
        site.documents.find((d) => d.type === type) || null;

      return {
        id: site.id,
        siteName: site.siteName,
        tenderNo: site.tenderNo,
        sdAmount: site.sdAmount,

        department: site.department,
        estimates: site.estimate,   // 🔥 IMPORTANT (used in Edit)

        sdFile: getSingleDoc("SD"),
        workOrderFile: getSingleDoc("WORK_ORDER"),
        tenderDocs: site.documents.filter(d => d.type === "TENDER"),

        createdAt: site.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedSites,
    });
  } catch (error) {
    console.error("GET /api/sites error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sites",
    });
  }
});

/* =====================================================
   GET SITE BY ID  ✅ (EDIT PAGE LOAD)
===================================================== */
router.get("/:id", getSiteByIdHandler);

/* =====================================================
   CREATE SITE
===================================================== */
router.post(
  "/",
  upload.fields([
    { name: "sdFile", maxCount: 1 },
    { name: "workOrderFile", maxCount: 1 },
    { name: "tenderDocs", maxCount: 10 },
  ]),
  createSiteHandler as any
);

/* =====================================================
   UPDATE SITE
===================================================== */
router.put(
  "/:id",
  upload.fields([
    { name: "sdFile", maxCount: 1 },
    { name: "workOrderFile", maxCount: 1 },
    { name: "tenderDocs", maxCount: 10 },
  ]),
  updateSiteHandler as any
);

/* =====================================================
   DELETE SITE (SOFT DELETE)
===================================================== */
router.delete("/:id", async (req, res) => {
  try {
    await prisma.site.update({
      where: { id: req.params.id },
      data: { isDeleted: true },
    });

    res.status(200).json({
      success: true,
      message: "Site deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/sites/:id error:", error);
    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
});

export default router;
