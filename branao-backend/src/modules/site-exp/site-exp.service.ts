import prisma from "../../lib/prisma";
import { Prisma } from "@prisma/client";

type TxClient = Prisma.TransactionClient;

/* =========================
   Helpers
========================= */
const cleanStr = (v: any) => {
  if (v === undefined || v === null) return undefined;
  return String(v).trim();
};

const toDateOrUndefined = (v: any) => {
  if (!v) return undefined;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? undefined : d;
};

const toNumOrUndefined = (v: any) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const TXN_SOURCE = "SITE_EXPENSE" as const;
const TXN_NATURE = "DEBIT" as const;

// ✅ Prisma interactive transaction timeout fix
const TX_OPTS = { timeout: 20000, maxWait: 20000 };

/**
 * ✅ Upsert SiteTransaction for a SiteExpense record
 * Requires in schema:
 *   @@unique([source, sourceId])
 */
async function upsertTxnForExpense(
  tx: TxClient,
  expense: {
    id: string;
    siteId: string;
    expenseDate: Date;
    expenseTitle: string;
    summary: string;
    paymentDetails: string | null;
    amount: any;
    isDeleted?: boolean;
    deletedAt?: Date | null;
    deletedBy?: string | null;
  }
) {
  const title =
    (expense.expenseTitle || "").trim() ||
    (expense.summary || "").trim() ||
    "Site Expense";

  const remarks = (expense.paymentDetails || "").trim() || null;

  // ✅ common payload
  const common: any = {
    siteId: expense.siteId,
    txnDate: expense.expenseDate,
    source: TXN_SOURCE,
    sourceId: expense.id,
    nature: TXN_NATURE,
    amount: expense.amount,
    title,
    remarks,
    meta: {
      paymentDetails: expense.paymentDetails || "",
      expenseTitle: expense.expenseTitle || "",
      summary: expense.summary || "",
    },
  };

  // ✅ optional soft delete sync (if fields exist in SiteTransaction model)
  if (typeof expense.isDeleted === "boolean") {
    common.isDeleted = expense.isDeleted;
    common.deletedAt = expense.deletedAt ?? null;
    common.deletedBy = expense.deletedBy ?? null;
  }

  // ✅ upsert using compound unique key (source + sourceId)
  return tx.siteTransaction.upsert({
    where: {
      source_sourceId: {
        source: TXN_SOURCE,
        sourceId: expense.id,
      },
    },
    create: common,
    update: common,
  });
}

/* =========================================================
   CREATE SITE EXPENSE  (+ SiteTransaction)
========================================================= */
export const createSiteExpense = async (
  data: {
    siteId: string;
    expenseDate: string;
    expenseTitle?: string;
    expenseSummary?: string;
    paymentDetails?: string;
    amount: number;
  },
  userId?: string,
  ip?: string
) => {
  const expenseDate = toDateOrUndefined(data.expenseDate);
  if (!expenseDate) throw new Error("Invalid expenseDate");

  const amt = toNumOrUndefined(data.amount);
  if (amt === undefined || amt <= 0) throw new Error("Invalid amount");

  return prisma.$transaction(async (tx) => {
    const created = await tx.siteExpense.create({
      data: {
        siteId: data.siteId,
        expenseDate,
        expenseTitle: (data.expenseTitle || "").trim(),
        summary: (data.expenseSummary || "").trim(),
        paymentDetails: (data.paymentDetails || "").trim() || null,
        amount: amt,
      },
    });

    // ✅ Sync SiteTransaction (DEBIT)
    await upsertTxnForExpense(tx, {
      id: created.id,
      siteId: created.siteId,
      expenseDate: created.expenseDate,
      expenseTitle: created.expenseTitle,
      summary: created.summary,
      paymentDetails: created.paymentDetails,
      amount: created.amount,
      isDeleted: created.isDeleted,
      deletedAt: created.deletedAt,
      deletedBy: created.deletedBy,
    });

    // 🔐 AUDIT LOG
    await tx.auditLog.create({
      data: {
        userId,
        module: "SiteExpense",
        recordId: created.id,
        action: "CREATE",
        newData: created as any,
        ip,
      },
    });

    return created;
  }, TX_OPTS);
};

/* =========================================================
   GET ALL SITE EXPENSES (ACTIVE ONLY)
========================================================= */
export const getAllSiteExpenses = async () => {
  return prisma.siteExpense.findMany({
    where: { isDeleted: false },
    orderBy: { expenseDate: "desc" },
    include: {
      site: {
        select: { id: true, siteName: true },
      },
    },
  });
};

/* =========================================================
   GET EXPENSES BY SITE (ACTIVE ONLY)
========================================================= */
export const getExpensesBySite = async (siteId: string) => {
  return prisma.siteExpense.findMany({
    where: { siteId, isDeleted: false },
    orderBy: { expenseDate: "desc" },
  });
};

/* =========================================================
   UPDATE SITE EXPENSE (+ SiteTransaction update)
   ✅ IMPORTANT: do not overwrite fields if not provided
========================================================= */
export const updateSiteExpense = async (
  id: string,
  data: {
    siteId?: string;
    expenseDate?: string;
    expenseTitle?: string;
    expenseSummary?: string;
    paymentDetails?: string;
    amount?: number;
  },
  userId?: string,
  ip?: string
) => {
  return prisma.$transaction(async (tx) => {
    const oldData = await tx.siteExpense.findUnique({ where: { id } });
    if (!oldData) throw new Error("Expense not found");

    const patch: any = {};

    if (data.siteId !== undefined) patch.siteId = data.siteId;

    if (data.expenseDate !== undefined) {
      const d = toDateOrUndefined(data.expenseDate);
      if (!d) throw new Error("Invalid expenseDate");
      patch.expenseDate = d;
    }

    if (data.expenseTitle !== undefined)
      patch.expenseTitle = cleanStr(data.expenseTitle) ?? "";

    if (data.expenseSummary !== undefined)
      patch.summary = cleanStr(data.expenseSummary) ?? "";

    if (data.paymentDetails !== undefined) {
      const v = cleanStr(data.paymentDetails);
      patch.paymentDetails = v ? v : null;
    }

    if (data.amount !== undefined) {
      const amt = toNumOrUndefined(data.amount);
      if (amt === undefined || amt <= 0) throw new Error("Invalid amount");
      patch.amount = amt;
    }

    const updated = await tx.siteExpense.update({
      where: { id },
      data: patch,
    });

    // ✅ Sync SiteTransaction
    await upsertTxnForExpense(tx, {
      id: updated.id,
      siteId: updated.siteId,
      expenseDate: updated.expenseDate,
      expenseTitle: updated.expenseTitle,
      summary: updated.summary,
      paymentDetails: updated.paymentDetails,
      amount: updated.amount,
      isDeleted: updated.isDeleted,
      deletedAt: updated.deletedAt,
      deletedBy: updated.deletedBy,
    });

    // 🔐 AUDIT LOG
    await tx.auditLog.create({
      data: {
        userId,
        module: "SiteExpense",
        recordId: id,
        action: "UPDATE",
        oldData: oldData as any,
        newData: updated as any,
        ip,
      },
    });

    return updated;
  }, TX_OPTS);
};

/* =========================================================
   SOFT DELETE SITE EXPENSE (+ SiteTransaction soft delete)
========================================================= */
export const softDeleteSiteExpense = async (
  id: string,
  userId?: string,
  ip?: string
) => {
  return prisma.$transaction(async (tx) => {
    const oldData = await tx.siteExpense.findUnique({ where: { id } });
    if (!oldData) throw new Error("Expense not found");

    const deleted = await tx.siteExpense.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId || null,
      },
    });

    // ✅ Soft delete linked SiteTransaction (same source + sourceId)
    await tx.siteTransaction.update({
      where: {
        source_sourceId: {
          source: TXN_SOURCE,
          sourceId: id,
        },
      },
      data: {
        isDeleted: true,
        deletedAt: deleted.deletedAt,
        deletedBy: deleted.deletedBy,
      } as any,
    });

    // 🔐 AUDIT LOG
    await tx.auditLog.create({
      data: {
        userId,
        module: "SiteExpense",
        recordId: id,
        action: "DELETE",
        oldData: oldData as any,
        newData: deleted as any,
        ip,
      },
    });

    return deleted;
  }, TX_OPTS);
};

/* =========================================================
   RESTORE SITE EXPENSE (+ SiteTransaction restore)
========================================================= */
export const restoreSiteExpense = async (
  id: string,
  userId?: string,
  ip?: string
) => {
  return prisma.$transaction(async (tx) => {
    const oldData = await tx.siteExpense.findUnique({ where: { id } });
    if (!oldData) throw new Error("Expense not found");

    const restored = await tx.siteExpense.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      },
    });

    // ✅ Restore linked SiteTransaction
    await tx.siteTransaction.update({
      where: {
        source_sourceId: {
          source: TXN_SOURCE,
          sourceId: id,
        },
      },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      } as any,
    });

    // 🔐 AUDIT LOG
    await tx.auditLog.create({
      data: {
        userId,
        module: "SiteExpense",
        recordId: id,
        action: "RESTORE",
        oldData: oldData as any,
        newData: restored as any,
        ip,
      },
    });

    return restored;
  }, TX_OPTS);
};

/* =========================================================
   HARD DELETE SITE EXPENSE (DANGEROUS)
   ✅ Also remove linked SiteTransaction
========================================================= */
export const hardDeleteSiteExpense = async (
  id: string,
  userId?: string,
  ip?: string
) => {
  return prisma.$transaction(async (tx) => {
    const oldData = await tx.siteExpense.findUnique({ where: { id } });
    if (!oldData) throw new Error("Expense not found");

    // ✅ Remove txn first
    await tx.siteTransaction.deleteMany({
      where: { source: TXN_SOURCE, sourceId: id },
    });

    // ✅ Remove expense
    await tx.siteExpense.delete({ where: { id } });

    // 🔐 AUDIT LOG
    await tx.auditLog.create({
      data: {
        userId,
        module: "SiteExpense",
        recordId: id,
        action: "HARD_DELETE",
        oldData: oldData as any,
        ip,
      },
    });

    return true;
  }, TX_OPTS);
};
