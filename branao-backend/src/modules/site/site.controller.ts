import { Request, Response } from "express";
import {
  createSite,
  getSiteById,
  updateSite,
} from "./site.service";
import { SiteRequest } from "./site.types";

/* =====================================================
   CREATE SITE  ✅
===================================================== */
export const createSiteHandler = async (
  req: SiteRequest,
  res: Response
): Promise<void> => {
  try {
    const site = await createSite(req.body, req.files);

    res.status(201).json({
      success: true,
      data: site,
    });
  } catch (error) {
    console.error("❌ Site Create Error:", error);

    res.status(500).json({
      success: false,
      message: "Site create failed",
    });
  }
};

/* =====================================================
   GET SITE BY ID  ✅ (EDIT FORM LOAD)
===================================================== */
export const getSiteByIdHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Site ID is required",
      });
      return;
    }

    const site = await getSiteById(id);

    if (!site) {
      res.status(404).json({
        success: false,
        message: "Site not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: site,
    });
  } catch (error) {
    console.error("❌ Get Site By ID Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch site",
    });
  }
};

/* =====================================================
   UPDATE SITE  ✅ (EDIT SAVE)
===================================================== */
export const updateSiteHandler = async (
  req: SiteRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Site ID is required",
      });
      return;
    }

    await updateSite(id, req.body, req.files);

    res.status(200).json({
      success: true,
      message: "Site updated successfully",
    });
  } catch (error) {
    console.error("❌ Site Update Error:", error);

    res.status(500).json({
      success: false,
      message: "Site update failed",
    });
  }
};
