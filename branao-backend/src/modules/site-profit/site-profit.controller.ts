import { Request, Response } from "express";
import { getSiteProfitData } from "./site-profit.service";

/**
 * GET /api/site-profit
 * Optional query:
 *   siteId, from, to
 */
export const getAll = async (req: Request, res: Response) => {
  try {
    // ✅ IMPORTANT: Disable caching so browser doesn't return 304 / old response
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");

    const { siteId, from, to } = req.query as any;

    const data = await getSiteProfitData({
      siteId: siteId || undefined,
      from: from || undefined,
      to: to || undefined,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Site Profit Fetch Error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch site profit data",
    });
  }
};
