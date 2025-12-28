import { Router } from "express";
import siteRoutes from "../modules/site/site.routes";

const router = Router();

router.use("/site", siteRoutes);

export default router;
