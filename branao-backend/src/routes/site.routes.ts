import { Router } from "express";
import siteRoutes from "../modules/site/site.routes";
import departmentRoutes from "../modules/department/department.routes";
const router = Router();

router.use("/site", siteRoutes);
router.use("/departments", departmentRoutes);

export default router;
