import prisma from "../../lib/prisma";

/* =========================
   CREATE
========================= */
export const createSiteTransaction = async (
  data: {
    siteId: string;
    txnDate: string | Date;
    source: any; // enum string
    sourceId: string;
    nature: any; // enum string
    amount: number;
    title?: string;
    remarks?: string;
    meta?: any;
  },
  userId?: string,
  ip?: string
) => {
  const txnDate = data.txnDate instanceof Date ? data.txnDate : new Date(String(data.txnDate));
  if (isNaN(txnDate.getTime())) throw new Error("Invalid txnDate");

  if (!data.siteId || !data.source || !data.sourceId || !data.nature) {
    throw new Error("siteId, source, sourceId, nature are required");
  }

  if (!Number.isFinite(Number(data.amount)) || Number(data.amount) <= 0) {
    throw new Error("amount must be > 0");
  }

  const created = await prisma.siteTransaction.create({
    data: {
      siteId: data.siteId,
      txnDate,
      source: data.source,
      sourceId: data.sourceId,
      nature: data.nature,
      amount: Number(data.amount),
      title: (data.title || "").trim() || null,
      remarks: (data.remarks || "").trim() || null,
      meta: data.meta ?? undefined,

      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    },
    include: {
      site: { select: { id: true, siteName: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "SiteTransaction",
      recordId: created.id,
      action: "CREATE",
      newData: created as any,
      ip,
    },
  });

  return created;
};

/* =========================
   READ (ACTIVE)
========================= */
export const getAllActiveTransactions = async (filters?: {
  siteId?: string;
  from?: string;
  to?: string;
  source?: string;
  nature?: string;
}) => {
  const where: any = { isDeleted: false };

  if (filters?.siteId) where.siteId = filters.siteId;
  if (filters?.source) where.source = filters.source;
  if (filters?.nature) where.nature = filters.nature;

  if (filters?.from || filters?.to) {
    where.txnDate = {};
    if (filters.from) where.txnDate.gte = new Date(filters.from);
    if (filters.to) where.txnDate.lte = new Date(filters.to);
  }

  return prisma.siteTransaction.findMany({
    where,
    orderBy: { txnDate: "desc" },
    include: {
      site: { select: { id: true, siteName: true } },
    },
  });
};

export const getTransactionsBySite = async (
  siteId: string,
  filters?: { from?: string; to?: string; source?: string; nature?: string }
) => {
  return getAllActiveTransactions({ ...filters, siteId });
};

/* =========================
   READ (DELETED)
========================= */
export const getDeletedTransactions = async (filters?: {
  siteId?: string;
  from?: string;
  to?: string;
  source?: string;
  nature?: string;
}) => {
  const where: any = { isDeleted: true };

  if (filters?.siteId) where.siteId = filters.siteId;
  if (filters?.source) where.source = filters.source;
  if (filters?.nature) where.nature = filters.nature;

  if (filters?.from || filters?.to) {
    where.txnDate = {};
    if (filters.from) where.txnDate.gte = new Date(filters.from);
    if (filters.to) where.txnDate.lte = new Date(filters.to);
  }

  return prisma.siteTransaction.findMany({
    where,
    orderBy: { deletedAt: "desc" },
    include: {
      site: { select: { id: true, siteName: true } },
    },
  });
};

/* =========================
   UPDATE
========================= */
export const updateSiteTransaction = async (
  id: string,
  data: {
    siteId?: string;
    txnDate?: string | Date;
    source?: any;
    sourceId?: string;
    nature?: any;
    amount?: number;
    title?: string;
    remarks?: string;
    meta?: any;
  },
  userId?: string,
  ip?: string
) => {
  const oldData = await prisma.siteTransaction.findUnique({ where: { id } });
  if (!oldData) throw new Error("Transaction not found");

  const patch: any = {};

  if (data.siteId !== undefined) patch.siteId = data.siteId;
  if (data.source !== undefined) patch.source = data.source;
  if (data.sourceId !== undefined) patch.sourceId = data.sourceId;
  if (data.nature !== undefined) patch.nature = data.nature;

  if (data.txnDate !== undefined) {
    const d = data.txnDate instanceof Date ? data.txnDate : new Date(String(data.txnDate));
    if (isNaN(d.getTime())) throw new Error("Invalid txnDate");
    patch.txnDate = d;
  }

  if (data.amount !== undefined) {
    if (!Number.isFinite(Number(data.amount)) || Number(data.amount) <= 0) {
      throw new Error("amount must be > 0");
    }
    patch.amount = Number(data.amount);
  }

  if (data.title !== undefined) patch.title = (data.title || "").trim() || null;
  if (data.remarks !== undefined) patch.remarks = (data.remarks || "").trim() || null;
  if (data.meta !== undefined) patch.meta = data.meta ?? undefined;

  const updated = await prisma.siteTransaction.update({
    where: { id },
    data: patch,
    include: { site: { select: { id: true, siteName: true } } },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "SiteTransaction",
      recordId: id,
      action: "UPDATE",
      oldData: oldData as any,
      newData: updated as any,
      ip,
    },
  });

  return updated;
};

/* =========================
   SOFT DELETE
========================= */
export const softDeleteSiteTransaction = async (
  id: string,
  userId?: string,
  ip?: string
) => {
  const oldData = await prisma.siteTransaction.findUnique({ where: { id } });
  if (!oldData) throw new Error("Transaction not found");

  const deleted = await prisma.siteTransaction.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "SiteTransaction",
      recordId: id,
      action: "DELETE",
      oldData: oldData as any,
      newData: deleted as any,
      ip,
    },
  });

  return deleted;
};

/* =========================
   RESTORE
========================= */
export const restoreSiteTransaction = async (
  id: string,
  userId?: string,
  ip?: string
) => {
  const oldData = await prisma.siteTransaction.findUnique({ where: { id } });
  if (!oldData) throw new Error("Transaction not found");

  const restored = await prisma.siteTransaction.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "SiteTransaction",
      recordId: id,
      action: "RESTORE",
      oldData: oldData as any,
      newData: restored as any,
      ip,
    },
  });

  return restored;
};

/* =========================
   HARD DELETE
========================= */
export const hardDeleteSiteTransaction = async (
  id: string,
  userId?: string,
  ip?: string
) => {
  const oldData = await prisma.siteTransaction.findUnique({ where: { id } });
  if (!oldData) throw new Error("Transaction not found");

  await prisma.siteTransaction.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId,
      module: "SiteTransaction",
      recordId: id,
      action: "HARD_DELETE",
      oldData: oldData as any,
      ip,
    },
  });

  return true;
};
