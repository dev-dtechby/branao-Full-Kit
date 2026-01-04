import prisma from "../../lib/prisma";

/**
 * Profit is calculated from SiteTransaction:
 *  - CREDIT = income
 *  - DEBIT  = cost
 * profit = credit - debit
 */
export const getSiteProfitData = async (filters?: {
  siteId?: string;
  from?: string;
  to?: string;
}) => {
  const whereTxn: any = {
    isDeleted: false,
  };

  // ✅ optional filters
  if (filters?.siteId) whereTxn.siteId = filters.siteId;

  // date range filter
  if (filters?.from || filters?.to) {
    whereTxn.txnDate = {};
    if (filters.from) whereTxn.txnDate.gte = new Date(filters.from);
    if (filters.to) whereTxn.txnDate.lte = new Date(filters.to);
  }

  // 1) Load sites (for department, name, status)
  const sites = await prisma.site.findMany({
    where: {
      isDeleted: false,
      ...(filters?.siteId ? { id: filters.siteId } : {}),
    },
    include: {
      department: true,
    },
    orderBy: { siteName: "asc" },
  });

  // 2) Aggregate transactions by siteId + nature
  const grouped = await prisma.siteTransaction.groupBy({
    by: ["siteId", "nature"],
    where: whereTxn,
    _sum: { amount: true },
  });

  // 3) Convert grouped result into map: siteId => { debit, credit }
  const map = new Map<string, { debit: number; credit: number }>();

  for (const row of grouped) {
    const siteId = row.siteId;
    const sumAmt = Number(row._sum.amount || 0);

    const current = map.get(siteId) || { debit: 0, credit: 0 };

    if (row.nature === "DEBIT") current.debit += sumAmt;
    if (row.nature === "CREDIT") current.credit += sumAmt;

    map.set(siteId, current);
  }

  // 4) Return final report
  return sites.map((site) => {
    const t = map.get(site.id) || { debit: 0, credit: 0 };

    const expenses = t.debit; // ✅ total cost
    const amountReceived = t.credit; // ✅ total income
    const profit = amountReceived - expenses;

    return {
      siteId: site.id,
      department: site.department?.name ?? "N/A",
      siteName: site.siteName,

      expenses,
      amountReceived,
      profit,

      status: site.status,
    };
  });
};
