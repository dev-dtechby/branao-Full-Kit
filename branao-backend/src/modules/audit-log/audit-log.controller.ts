import { Request, Response } from "express";
import * as service from "./audit-log.service";

export const getAuditLogs = async (_req: Request, res: Response) => {
  try {
    const logs = await service.getAllAuditLogs();

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error("❌ Get Audit Logs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
};
