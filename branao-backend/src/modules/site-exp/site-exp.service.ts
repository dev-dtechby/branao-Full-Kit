import prisma from "../../lib/prisma";

/* =========================================================
   CREATE SITE EXPENSE
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
  const created = await prisma.siteExpense.create({
    data: {
      siteId: data.siteId,
      expenseDate: new Date(data.expenseDate),
      expenseTitle: data.expenseTitle?.trim() || "",
      summary: data.expenseSummary?.trim() || "",
      paymentDetails: data.paymentDetails?.trim() || "",
      amount: Number(data.amount),
    },
  });

  /* 🔐 AUDIT LOG */
  await prisma.auditLog.create({
    data: {
      userId,
      module: "SiteExpense",
      recordId: created.id,
      action: "CREATE",
      newData: created,
      ip,
    },
  });

  return created;
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
        select: {
          id: true,
          siteName: true,
        },
      },
    },
  });
};

/* =========================================================
   GET EXPENSES BY SITE (ACTIVE ONLY)
========================================================= */
export const getExpensesBySite = async (siteId: string) => {
  return prisma.siteExpense.findMany({
    where: {
      siteId,
      isDeleted: false,
    },
    orderBy: { expenseDate: "desc" },
  });
};

/* =========================================================
   UPDATE SITE EXPENSE
========================================================= */
export const updateSiteExpense = async (
  id: string,
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
  const oldData = await prisma.siteExpense.findUnique({
    where: { id },
  });

  if (!oldData) throw new Error("Expense not found");

  const updated = await prisma.siteExpense.update({
    where: { id },
    data: {
      siteId: data.siteId,
      expenseDate: new Date(data.expenseDate),
      expenseTitle: data.expenseTitle?.trim() || "",
      summary: data.expenseSummary?.trim() || "",
      paymentDetails: data.paymentDetails?.trim() || "",
      amount: Number(data.amount),
    },
  });

  /* 🔐 AUDIT LOG */
  await prisma.auditLog.create({
    data: {
      userId,
      module: "SiteExpense",
      recordId: id,
      action: "UPDATE",
      oldData,
      newData: updated,
      ip,
    },
  });

  return updated;
};

/* =========================================================
   SOFT DELETE SITE EXPENSE
========================================================= */
export const softDeleteSiteExpense = async (
  id: string,
  userId?: string,
  ip?: string
) => {
  const oldData = await prisma.siteExpense.findUnique({
    where: { id },
  });

  if (!oldData) throw new Error("Expense not found");

  const deleted = await prisma.siteExpense.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId || null,
    },
  });

  /* 🔐 AUDIT LOG */
  await prisma.auditLog.create({
    data: {
      userId,
      module: "SiteExpense",
      recordId: id,
      action: "DELETE",
      oldData,
      newData: deleted,
      ip,
    },
  });

  return deleted;
};

/* =========================================================
   RESTORE SITE EXPENSE
========================================================= */
export const restoreSiteExpense = async (
  id: string,
  userId?: string,
  ip?: string
) => {
  const oldData = await prisma.siteExpense.findUnique({
    where: { id },
  });

  if (!oldData) throw new Error("Expense not found");

  const restored = await prisma.siteExpense.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    },
  });

  /* 🔐 AUDIT LOG */
  await prisma.auditLog.create({
    data: {
      userId,
      module: "SiteExpense",
      recordId: id,
      action: "RESTORE",
      oldData,
      newData: restored,
      ip,
    },
  });

  return restored;
};

/* =========================================================
   HARD DELETE SITE EXPENSE (DANGEROUS)
========================================================= */
export const hardDeleteSiteExpense = async (
  id: string,
  userId?: string,
  ip?: string
) => {
  const oldData = await prisma.siteExpense.findUnique({
    where: { id },
  });

  if (!oldData) throw new Error("Expense not found");

  await prisma.siteExpense.delete({
    where: { id },
  });

  /* 🔐 AUDIT LOG */
  await prisma.auditLog.create({
    data: {
      userId,
      module: "SiteExpense",
      recordId: id,
      action: "HARD_DELETE",
      oldData,
      ip,
    },
  });

  return true;
};
