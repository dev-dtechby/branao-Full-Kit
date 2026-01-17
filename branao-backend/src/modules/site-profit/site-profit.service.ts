import prisma from "../../lib/prisma";

/**
 * Profit is calculated from:
 * 1) SiteTransaction:
 *    - CREDIT = income
 *    - DEBIT  = cost
 *
 * 2) MaterialSupplierLedger (AUTO material cost):
 *    - cost = sum(totalAmt) OR sum(qty * rate)
 *
 * 3) Labour Contractor Ledger (AUTO labour cost):
 *    - cost = sum(LabourPayment.amount)
 *
 * NOTE:
 * - ERP is HARD DELETE mode now => no isDeleted filters anywhere.
 */
export const getSiteProfitData = async (filters?: {
  siteId?: string;
  from?: string;
  to?: string;
}) => {
  /* =========================
     0) Common date filters
  ========================= */
  const txnDateWhere: any = {};
  if (filters?.from) txnDateWhere.gte = new Date(filters.from);
  if (filters?.to) txnDateWhere.lte = new Date(filters.to);

  /* =========================
     1) Sites
  ========================= */
  const sites = await prisma.site.findMany({
    where: {
      ...(filters?.siteId ? { id: filters.siteId } : {}),
    },
    include: { department: true },
    orderBy: { siteName: "asc" },
  });

  /* =========================
     2) SiteTransaction (no isDeleted)
  ========================= */
  const whereTxn: any = {};
  if (filters?.siteId) whereTxn.siteId = filters.siteId;
  if (filters?.from || filters?.to) whereTxn.txnDate = txnDateWhere;

  const groupedTxn = await prisma.siteTransaction.groupBy({
    by: ["siteId", "nature"],
    where: whereTxn,
    _sum: { amount: true },
  });

  const txnMap = new Map<string, { debit: number; credit: number }>();
  for (const row of groupedTxn) {
    const siteId = row.siteId;
    const sumAmt = Number(row._sum.amount || 0);

    const current = txnMap.get(siteId) || { debit: 0, credit: 0 };
    if (row.nature === "DEBIT") current.debit += sumAmt;
    if (row.nature === "CREDIT") current.credit += sumAmt;

    txnMap.set(siteId, current);
  }

  /* =========================
     3) MaterialSupplierLedger cost (no isDeleted)
  ========================= */
  const whereMat: any = {};
  if (filters?.siteId) whereMat.siteId = filters.siteId;

  if (filters?.from || filters?.to) {
    whereMat.entryDate = {};
    if (filters.from) whereMat.entryDate.gte = new Date(filters.from);
    if (filters.to) whereMat.entryDate.lte = new Date(filters.to);
  }

  const matRows = await prisma.materialSupplierLedger.findMany({
    where: whereMat,
    select: { siteId: true, qty: true, rate: true, totalAmt: true },
  } as any);

  const matCostBySite = new Map<string, number>();

  for (const r of matRows) {
    if (!r.siteId) continue;

    const amt =
      r.totalAmt !== null &&
      r.totalAmt !== undefined &&
      !Number.isNaN(Number(r.totalAmt))
        ? Number(r.totalAmt) || 0
        : (Number(r.qty) || 0) * (Number(r.rate) || 0);

    matCostBySite.set(r.siteId, (matCostBySite.get(r.siteId) || 0) + amt);
  }

  /* =========================
     4) LabourPayment cost (AUTO labour cost)
  ========================= */
  const whereLab: any = {};
  if (filters?.siteId) whereLab.siteId = filters.siteId;

  if (filters?.from || filters?.to) {
    whereLab.paymentDate = {};
    if (filters.from) whereLab.paymentDate.gte = new Date(filters.from);
    if (filters.to) whereLab.paymentDate.lte = new Date(filters.to);
  }

  const labAgg = await prisma.labourPayment.groupBy({
    by: ["siteId"],
    where: whereLab,
    _sum: { amount: true },
  });

  const labourCostBySite = new Map<string, number>();
  for (const r of labAgg) {
    labourCostBySite.set(r.siteId, Number(r._sum.amount || 0));
  }

  /* =========================
     5) Final response
  ========================= */
  return sites.map((site) => {
    const t = txnMap.get(site.id) || { debit: 0, credit: 0 };

    const materialPurchaseCost = Number(matCostBySite.get(site.id) || 0);
    const labourContractorCost = Number(labourCostBySite.get(site.id) || 0);

    // ✅ total expenses = debit txn + material + labour
    const expenses =
      Number(t.debit || 0) + materialPurchaseCost + labourContractorCost;

    const amountReceived = Number(t.credit || 0);
    const profit = amountReceived - expenses;

    return {
      siteId: site.id,
      department: site.department?.name ?? "N/A",
      siteName: site.siteName,
      expenses,
      amountReceived,
      profit,
      status: site.status,
      materialPurchaseCost,
      labourContractorCost,
    };
  });
};
