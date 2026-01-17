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

const n = (v: any) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const rowTotal = (r: any) => {
  // prefer DB totalAmt else qty*rate
  if (r.totalAmt !== null && r.totalAmt !== undefined && !Number.isNaN(Number(r.totalAmt))) {
    return n(r.totalAmt);
  }
  return n(r.qty) * n(r.rate);
};

type AutoExpenseRow = {
  id: string;
  site: { id: string; siteName: string };
  expenseDate: string;
  expenseTitle: string;
  summary: string;
  paymentDetails: string;
  amount: number;
  isAuto: true;
  autoSource: "MATERIAL_SUPPLIER_LEDGER";
  supplierId?: string | null;
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

  if (typeof expense.isDeleted === "boolean") {
    common.isDeleted = expense.isDeleted;
    common.deletedAt = expense.deletedAt ?? null;
    common.deletedBy = expense.deletedBy ?? null;
  }

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
   ✅ AUTO EXPENSE FROM MATERIAL SUPPLIER LEDGER
   - GROUP BY (siteId + material)
   - amount = SUM(totalAmt if present else qty*rate)
   - expenseDate = MAX(entryDate) in group
   - read-only rows: isAuto = true
========================================================= */

function makeAutoId(siteId: string, material: string) {
  const slug = material
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);
  return `AUTO_MSL_${siteId}_${slug || "material"}`;
}

async function getAutoMaterialExpenses(siteId?: string) {
  // sites map
  const sites = await prisma.site.findMany({
    select: { id: true, siteName: true },
  });
  const siteNameById = new Map(sites.map((s) => [s.id, s.siteName]));

  const where: any = {};
  if (siteId) where.siteId = siteId;

  // ✅ fetch ledger rows (must include ledgerId)
  const ledgerRows = await prisma.materialSupplierLedger.findMany({
    where,
    select: {
      siteId: true,
      entryDate: true,
      material: true,
      qty: true,
      rate: true,
      totalAmt: true,
      ledgerId: true, // ✅ IMPORTANT
    },
    orderBy: { entryDate: "desc" },
  });

  // ✅ build ledgerId set, then fetch Ledger names
  const ledgerIds = Array.from(
    new Set(ledgerRows.map((r) => r.ledgerId).filter(Boolean))
  );

  const ledgers = ledgerIds.length
    ? await prisma.ledger.findMany({
        where: { id: { in: ledgerIds } },
        select: { id: true, name: true },
      })
    : [];

  const ledgerNameById = new Map(ledgers.map((l) => [l.id, l.name]));

  // group by (siteId + material)
  const groups = new Map<
    string,
    {
      siteId: string;
      material: string;
      amount: number;
      maxDate: Date;
      ledgerNames: Set<string>;
    }
  >();

  for (const r of ledgerRows) {
    if (!r.siteId) continue;

    const material = String(r.material || "").trim();
    if (!material) continue;

    const amt =
      r.totalAmt !== null && r.totalAmt !== undefined
        ? Number(r.totalAmt) || 0
        : (Number(r.qty) || 0) * (Number(r.rate) || 0);

    const key = `${r.siteId}__${material.toLowerCase()}`;

    const ledgerName =
      (r.ledgerId ? ledgerNameById.get(r.ledgerId) : null) || "Unknown Ledger";

    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        siteId: r.siteId,
        material,
        amount: amt,
        maxDate: r.entryDate || new Date(),
        ledgerNames: new Set([ledgerName]),
      });
    } else {
      existing.amount += amt;
      const dt = r.entryDate || new Date();
      if (dt.getTime() > existing.maxDate.getTime()) existing.maxDate = dt;
      existing.ledgerNames.add(ledgerName);
    }
  }

  const formatLedgers = (set: Set<string>) => {
    const arr = Array.from(set).filter(Boolean);
    if (!arr.length) return "Unknown Ledger";
    if (arr.length <= 3) return arr.join(", ");
    return `${arr.slice(0, 3).join(", ")} +${arr.length - 3} more`;
  };

  const autoRows = Array.from(groups.values()).map((g) => {
    const sName = siteNameById.get(g.siteId) || "N/A";

    return {
      id: makeAutoId(g.siteId, g.material),
      siteId: g.siteId,
      expenseDate: g.maxDate,
      expenseTitle: g.material,
      summary: "Material Purchase (Auto)",
      // ✅ Payment column now shows Ledger.name(s)
      paymentDetails: formatLedgers(g.ledgerNames),
      amount: Number(g.amount.toFixed(2)),
      isAuto: true,
      source: "MATERIAL_LEDGER",
      site: { id: g.siteId, siteName: sName },
    };
  });

  autoRows.sort(
    (a, b) =>
      new Date(b.expenseDate as any).getTime() -
      new Date(a.expenseDate as any).getTime()
  );

  return autoRows;
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
   ✅ GET ALL SITE EXPENSES (ACTIVE ONLY) + AUTO MATERIAL ROWS
========================================================= */
export const getAllSiteExpenses = async () => {
  const manual = await prisma.siteExpense.findMany({
    where: { isDeleted: false },
    orderBy: { expenseDate: "desc" },
    include: {
      site: {
        select: { id: true, siteName: true },
      },
    },
  });

  const manualMapped = manual.map((x) => ({
    ...x,
    isAuto: false,
    source: "MANUAL",
  }));

  const auto = await getAutoMaterialExpenses();

  // merge and sort by date desc
  const merged: any[] = [...manualMapped, ...auto].sort((a, b) => {
    const da = new Date(a.expenseDate).getTime();
    const db = new Date(b.expenseDate).getTime();
    return db - da;
  });

  return merged;
};

/* =========================================================
   ✅ GET EXPENSES BY SITE (ACTIVE ONLY) + AUTO MATERIAL ROWS
========================================================= */
export const getExpensesBySite = async (siteId: string) => {
  const manual = await prisma.siteExpense.findMany({
    where: { siteId, isDeleted: false },
    orderBy: { expenseDate: "desc" },
    include: {
      site: { select: { id: true, siteName: true } },
    },
  });

  const manualMapped = manual.map((x) => ({
    ...x,
    isAuto: false,
    source: "MANUAL",
  }));

  const auto = await getAutoMaterialExpenses(siteId);

  const merged: any[] = [...manualMapped, ...auto].sort((a, b) => {
    const da = new Date(a.expenseDate).getTime();
    const db = new Date(b.expenseDate).getTime();
    return db - da;
  });

  return merged;
};

/* =========================================================
   UPDATE SITE EXPENSE (+ SiteTransaction update)
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
========================================================= */
export const hardDeleteSiteExpense = async (
  id: string,
  userId?: string,
  ip?: string
) => {
  return prisma.$transaction(async (tx) => {
    const oldData = await tx.siteExpense.findUnique({ where: { id } });
    if (!oldData) throw new Error("Expense not found");

    await tx.siteTransaction.deleteMany({
      where: { source: TXN_SOURCE, sourceId: id },
    });

    await tx.siteExpense.delete({ where: { id } });

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
