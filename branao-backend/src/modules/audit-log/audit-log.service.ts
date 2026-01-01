import prisma from "../../lib/prisma";

export const getAllAuditLogs = async () => {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
  });
};
