import { Request, Response } from "express";
import SiteService from "./site.service";

export default {
  async createSite(req: Request, res: Response) {
    try {
      const site = await SiteService.createSite(req.body);
      res.json({ success: true, site });
    } catch (err:any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async getSites(req: Request, res: Response) {
    try {
      const sites = await SiteService.getSites();
      res.json({ success: true, sites });
    } catch (err:any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getSiteById(req: Request, res: Response) {
    try {
      const site = await SiteService.getSiteById(Number(req.params.id));
      res.json({ success: true, site });
    } catch (err:any) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  async updateSite(req: Request, res: Response) {
    try {
      const site = await SiteService.updateSite(Number(req.params.id), req.body);
      res.json({ success: true, site });
    } catch (err:any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async removeSite(req: Request, res: Response) {
    try {
      await SiteService.removeSite(Number(req.params.id));
      res.json({ success: true, message: "Site removed successfully" });
    } catch (err:any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },
};
