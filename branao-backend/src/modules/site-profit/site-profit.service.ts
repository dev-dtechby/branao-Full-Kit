import prisma from "../../lib/prisma";

/**
 * Profit is calculated from SiteTransaction:
 *  - CREDIT = income
 *  - DEBIT  = cost
 * PLUS MaterialSupplierLedger purchases (AUTO material cost):
 *  - cost = sum(totalAmt) OR sum(qty * rate)
 */
export const getSiteProfitData = async (filters?: {
  siteId?: string;
  from?: string;
  to?: string;
}) => {
  const whereTxn: any = { isDeleted: false };

  if (filters?.siteId) whereTxn.siteId = filters.siteId;

  if (filters?.from || filters?.to) {
    whereTxn.txnDate = {};
    if (filters.from) whereTxn.txnDate.gte = new Date(filters.from);
    if (filters.to) whereTxn.txnDate.lte = new Date(filters.to);
  }

  const sites = await prisma.site.findMany({
    where: {
      isDeleted: false,
      ...(filters?.siteId ? { id: filters.siteId } : {}),
    },
    include: { department: true },
    orderBy: { siteName: "asc" },
  });

  // 1) group SiteTransaction by site + nature
  const grouped = await prisma.siteTransaction.groupBy({
    by: ["siteId", "nature"],
    where: whereTxn,
    _sum: { amount: true },
  });

  const txnMap = new Map<string, { debit: number; credit: number }>();
  for (const row of grouped) {
    const siteId = row.siteId;
    const sumAmt = Number(row._sum.amount || 0);
    const current = txnMap.get(siteId) || { debit: 0, credit: 0 };
    if (row.nature === "DEBIT") current.debit += sumAmt;
    if (row.nature === "CREDIT") current.credit += sumAmt;
    txnMap.set(siteId, current);
  }

  // 2) MaterialSupplierLedger cost map (NO isDeleted filter)
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
      r.totalAmt !== null && r.totalAmt !== undefined && !Number.isNaN(Number(r.totalAmt))
        ? Number(r.totalAmt) || 0
        : (Number(r.qty) || 0) * (Number(r.rate) || 0);

    matCostBySite.set(r.siteId, (matCostBySite.get(r.siteId) || 0) + amt);
  }

  // 3) final
  return sites.map((site) => {
    const t = txnMap.get(site.id) || { debit: 0, credit: 0 };
    const materialPurchaseCost = Number(matCostBySite.get(site.id) || 0);

    const expenses = Number(t.debit || 0) + materialPurchaseCost;
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
    };
  });
};
