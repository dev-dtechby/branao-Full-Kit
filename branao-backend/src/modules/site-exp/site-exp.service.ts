// D:\Projects\branao.in\clone\branao-Full-Kit\branao-backend\src\modules\site-exp\site-exp.service.ts

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
  if (
    r.totalAmt !== null &&
    r.totalAmt !== undefined &&
    !Number.isNaN(Number(r.totalAmt))
  ) {
    return n(r.totalAmt);
  }
  return n(r.qty) * n(r.rate);
};

type AutoExpenseRow = {
  id: string;
  site: { id: string; siteName: string };
  expenseDate: string | Date;
  expenseTitle: string;
  summary: string;
  paymentDetails: string;
  amount: number;
  isAuto: true;
  autoSource: "MATERIAL_SUPPLIER_LEDGER" | "LABOUR_CONTRACTOR_LEDGER";
  source: "MATERIAL_LEDGER" | "LABOUR_CONTRACTOR_LEDGER";
};

const TXN_SOURCE = "SITE_EXPENSE" as const;
const TXN_NATURE = "DEBIT" as const;

// ✅ Prisma interactive transaction timeout fix
const TX_OPTS = { timeout: 20000, maxWait: 20000 };

/**
 * ✅ Upsert SiteTransaction for a SiteExpense record
 * Requires in schema:
 *   @@unique([source, sourceId])
 *
 * NOTE:
 * - Hard delete mode: no isDeleted/deletedAt/deletedBy handling here.
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
   - GROUP BY (siteId + material + ledgerId) ✅ FIX
   - amount = SUM(totalAmt if present else qty*rate)
   - expenseDate = MAX(entryDate) in group
   - read-only rows: isAuto = true
   - paymentDetails = SINGLE ledger name (party) ✅ FIX
========================================================= */

function makeAutoId(siteId: string, material: string, ledgerIdOrName: string) {
  const slug = String(material || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);

  const lslug = String(ledgerIdOrName || "unknown")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);

  return `AUTO_MSL_${siteId}_${slug || "material"}_${lslug || "ledger"}`;
}

async function getAutoMaterialExpenses(siteId?: string): Promise<AutoExpenseRow[]> {
  // sites map
  const sites = await prisma.site.findMany({
    select: { id: true, siteName: true },
  });
  const siteNameById = new Map(sites.map((s) => [s.id, s.siteName]));

  const where: any = {};
  if (siteId) where.siteId = siteId;

  // ✅ fetch ledger rows
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

  // ✅ fetch Ledger names
  const ledgerIds = Array.from(
    new Set(ledgerRows.map((r) => r.ledgerId).filter(Boolean))
  ) as string[];

  const ledgers = ledgerIds.length
    ? await prisma.ledger.findMany({
        where: { id: { in: ledgerIds } },
        select: { id: true, name: true },
      })
    : [];

  const ledgerNameById = new Map(ledgers.map((l) => [l.id, l.name]));

  // ✅ GROUP BY (siteId + material + ledgerId)
  const groups = new Map<
    string,
    {
      siteId: string;
      material: string;
      amount: number;
      maxDate: Date;
      ledgerId: string;
      ledgerName: string;
    }
  >();

  for (const r of ledgerRows) {
    if (!r.siteId) continue;

    const material = String(r.material || "").trim();
    if (!material) continue;

    const ledgerId = String(r.ledgerId || "UNKNOWN_LEDGER");
    const ledgerName =
      (r.ledgerId ? ledgerNameById.get(r.ledgerId) : null) || "Unknown Ledger";

    const amt = rowTotal(r);

    const key = `${r.siteId}__${material.toLowerCase()}__${ledgerId}`;
    const existing = groups.get(key);
    const dt = r.entryDate || new Date();

    if (!existing) {
      groups.set(key, {
        siteId: r.siteId,
        material,
        amount: amt,
        maxDate: dt,
        ledgerId,
        ledgerName,
      });
    } else {
      existing.amount += amt;
      if (dt.getTime() > existing.maxDate.getTime()) existing.maxDate = dt;
    }
  }

  const autoRows: AutoExpenseRow[] = Array.from(groups.values()).map((g) => {
    const sName = siteNameById.get(g.siteId) || "N/A";

    return {
      id: makeAutoId(g.siteId, g.material, g.ledgerId),
      site: { id: g.siteId, siteName: sName },
      expenseDate: g.maxDate,
      expenseTitle: g.material, // e.g. Sand / Limestone
      summary: "Material Purchase (Auto)",
      paymentDetails: g.ledgerName, // ✅ single party only
      amount: Number(g.amount.toFixed(2)),
      isAuto: true,
      autoSource: "MATERIAL_SUPPLIER_LEDGER",
      source: "MATERIAL_LEDGER",
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
   ✅ AUTO EXPENSE FROM LABOUR CONTRACTOR LEDGER (TOTAL PAID)
   - GROUP BY (siteId + contractorId)
   - amount = SUM(amount)
   - expenseDate = MAX(paymentDate)
   - Expenses: Labour Payment
   - Exp. Summary: Labour Payment
   - Payment: Contractor name
   - read-only rows: isAuto = true
========================================================= */

function makeLabAutoId(siteId: string, contractorId: string) {
  return `AUTO_LAB_${siteId}_${contractorId}`;
}

async function getAutoLabourExpenses(siteId?: string): Promise<AutoExpenseRow[]> {
  // sites map
  const sites = await prisma.site.findMany({
    select: { id: true, siteName: true },
  });
  const siteNameById = new Map(sites.map((s) => [s.id, s.siteName]));

  const where: any = {};
  if (siteId) where.siteId = siteId;

  // ✅ aggregate payments
  const agg = await prisma.labourPayment.groupBy({
    by: ["siteId", "contractorId"],
    where,
    _sum: { amount: true },
    _max: { paymentDate: true },
  });

  const contractorIds = Array.from(
    new Set(agg.map((a) => a.contractorId).filter(Boolean))
  ) as string[];

  const contractors = contractorIds.length
    ? await prisma.labourContractor.findMany({
        where: { id: { in: contractorIds } },
        select: { id: true, name: true },
      })
    : [];

  const contractorNameById = new Map(contractors.map((c) => [c.id, c.name]));

  const rows: AutoExpenseRow[] = agg.map((g) => {
    const sName = siteNameById.get(g.siteId) || "N/A";
    const cName =
      contractorNameById.get(g.contractorId) || "Labour Contractor";

    return {
      id: makeLabAutoId(g.siteId, g.contractorId),
      site: { id: g.siteId, siteName: sName },
      expenseDate: g._max.paymentDate || new Date(),
      expenseTitle: "Labour Payment",
      summary: "Labour Payment",
      paymentDetails: cName,
      amount: Number(Number(g._sum.amount || 0).toFixed(2)),
      isAuto: true,
      autoSource: "LABOUR_CONTRACTOR_LEDGER",
      source: "LABOUR_CONTRACTOR_LEDGER",
    };
  });

  rows.sort(
    (a, b) =>
      new Date(b.expenseDate as any).getTime() -
      new Date(a.expenseDate as any).getTime()
  );

  return rows;
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
   ✅ GET ALL SITE EXPENSES + AUTO MATERIAL + AUTO LABOUR
========================================================= */
export const getAllSiteExpenses = async () => {
  const manual = await prisma.siteExpense.findMany({
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

  const autoMaterial = await getAutoMaterialExpenses();
  const autoLabour = await getAutoLabourExpenses();

  const merged: any[] = [...manualMapped, ...autoMaterial, ...autoLabour].sort(
    (a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
  );

  return merged;
};

/* =========================================================
   ✅ GET EXPENSES BY SITE + AUTO MATERIAL + AUTO LABOUR
========================================================= */
export const getExpensesBySite = async (siteId: string) => {
  const manual = await prisma.siteExpense.findMany({
    where: { siteId },
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

  const autoMaterial = await getAutoMaterialExpenses(siteId);
  const autoLabour = await getAutoLabourExpenses(siteId);

  const merged: any[] = [...manualMapped, ...autoMaterial, ...autoLabour].sort(
    (a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
  );

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
   ✅ HARD DELETE SITE EXPENSE (ERP is HARD DELETE now)
   - also remove SiteTransaction rows (source=SITE_EXPENSE)
========================================================= */
export const deleteSiteExpense = async (
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

/* =========================================================
   Backward compatible exports (if any old controller still calls these)
========================================================= */
export const hardDeleteSiteExpense = deleteSiteExpense;
