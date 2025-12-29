import { Router } from "express";
import siteRoutes from "../modules/site/site.routes";
import departmentRoutes from "../modules/department/department.routes";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ success: true, message: "API running 🚀" });
});

router.use("/sites", siteRoutes);
router.use("/departments", departmentRoutes);

export default router;
