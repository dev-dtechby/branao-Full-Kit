import { Router } from "express";
import { getAuditLogs } from "./audit-log.controller";

const router = Router();

/**
 * GET /api/audit-log
 */
router.get("/", getAuditLogs);

export default router;
