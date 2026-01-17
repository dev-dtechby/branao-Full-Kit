import prisma from "../../lib/prisma";

type PurchaseType = "OWN_VEHICLE" | "RENT_VEHICLE";

type BulkRow = {
  rowKey?: string;

  entryDate?: string; // ISO (row-wise)
  slipNo?: string | null;

  through?: string | null;
  purchaseType: PurchaseType;

  vehicleNumber: string;
  vehicleName?: string | null;

  fuelType: string;
  qty: number | string;
  rate: number | string;

  remarks?: string | null;
};

const n = (v: any) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

function buildExpenseTitle(fuelType: string) {
  const ft = String(fuelType || "").trim();
  return ft ? `Fuel Purchase - ${ft}` : "Fuel Purchase";
}

function buildExpenseSummary(p: {
  fuelStationName: string;
  fuelType: string;
  purchaseType: string;
  vehicleNumber: string;
  vehicleName?: string | null;
  through?: string | null;
  slipNo?: string | null;
  remarks?: string | null;
}) {
  const parts: string[] = [];
  parts.push(`Fuel Station: ${p.fuelStationName}`);
  if (p.fuelType) parts.push(`Fuel: ${p.fuelType}`);
  parts.push(`PurchaseType: ${p.purchaseType}`);

  parts.push(`VehicleNo: ${p.vehicleNumber}`);
  if (p.vehicleName) parts.push(`Vehicle: ${p.vehicleName}`);

  if (p.through) parts.push(`Through: ${p.through}`);
  if (p.slipNo) parts.push(`SlipNo: ${p.slipNo}`);
  if (p.remarks) parts.push(`Remarks: ${p.remarks}`);

  return parts.join(" | ");
}

/**
 * ✅ GET Ledger rows
 * - ledgerId = Fuel Station ledger (Ledger table)
 * - siteId optional
 */
export async function getLedger(filters: { ledgerId?: string; siteId?: string }) {
  return prisma.fuelStationLedger.findMany({
    where: {
      ledgerId: filters.ledgerId,
      siteId: filters.siteId,
    },
    include: {
      site: { select: { id: true, siteName: true } },
      ledger: { select: { id: true, name: true } },
    },
    orderBy: { entryDate: "asc" },
  });
}

/**
 * ✅ CREATE BULK
 * - Creates SiteExpense for each row
 * - Creates FuelStationLedger row linked to SiteExpense
 */
export async function createBulk(input: {
  ledgerId: string; // ✅ Fuel Station = Ledger table ID
  siteId: string;
  entryDate?: string; // fallback date
  rows: BulkRow[];
}) {
  // ✅ Fuel Station details fetched from Ledger table
  const fuelStationLedger = await prisma.ledger.findUnique({
    where: { id: input.ledgerId },
    select: { id: true, name: true },
  });

  if (!fuelStationLedger) throw new Error("Fuel station ledger not found");

  const fallbackDate = input.entryDate ? new Date(input.entryDate) : new Date();

  const tx = await prisma.$transaction(async (pr) => {
    const created: any[] = [];

    for (const r of input.rows) {
      const entryDate = r.entryDate ? new Date(r.entryDate) : fallbackDate;

      const qty = n(r.qty);
      const rate = n(r.rate);
      const amount = qty * rate;

      const fuelType = String(r.fuelType || "").trim();
      const vehicleNumber = String(r.vehicleNumber || "").trim();

      if (!fuelType) throw new Error("fuelType required");
      if (!vehicleNumber) throw new Error("vehicleNumber required");
      if (!(qty > 0)) throw new Error("qty must be > 0");
      if (!(rate > 0)) throw new Error("rate must be > 0");

      const purchaseType = r.purchaseType as any;
      if (!purchaseType) throw new Error("purchaseType required");

      // 1) create SiteExpense
      const expenseTitle = buildExpenseTitle(fuelType);
      const expenseSummary = buildExpenseSummary({
        fuelStationName: fuelStationLedger.name,
        fuelType,
        purchaseType: String(purchaseType),
        vehicleNumber,
        vehicleName: r.vehicleName ?? null,
        through: r.through ?? null,
        slipNo: r.slipNo ?? null,
        remarks: r.remarks ?? null,
      });

      const siteExpense = await pr.siteExpense.create({
        data: {
          siteId: input.siteId,
          expenseDate: entryDate,
          expenseTitle,
          summary: expenseSummary,
          paymentDetails: r.through ? String(r.through).trim() : null,
          amount: amount as any,
        },
        select: { id: true },
      });

      // 2) create FuelStationLedger row
      const ledgerRow = await pr.fuelStationLedger.create({
        data: {
          ledgerId: input.ledgerId,
          siteId: input.siteId,
          siteExpenseId: siteExpense.id,

          entryDate,

          slipNo: r.slipNo ? String(r.slipNo).trim() : null,
          through: r.through ? String(r.through).trim() : null,
          purchaseType: purchaseType,

          vehicleNumber,
          vehicleName: r.vehicleName ? String(r.vehicleName).trim() : null,

          fuelType,
          qty: qty as any,
          rate: rate as any,
          amount: amount as any,

          remarks: r.remarks ? String(r.remarks).trim() : null,
        },
        include: {
          site: { select: { id: true, siteName: true } },
          ledger: { select: { id: true, name: true } },
        },
      });

      created.push(ledgerRow);
    }

    return created;
  });

  return { count: tx.length, data: tx };
}

/**
 * ✅ UPDATE ONE
 * - updates FuelStationLedger + linked SiteExpense
 */
export async function updateOne(id: string, patch: any) {
  const existing = await prisma.fuelStationLedger.findUnique({
    where: { id },
    include: {
      ledger: { select: { id: true, name: true } },
      siteExpense: { select: { id: true } },
    },
  });

  if (!existing) throw new Error("Row not found");

  const nextQty = patch.qty != null ? n(patch.qty) : n(existing.qty);
  const nextRate = patch.rate != null ? n(patch.rate) : n(existing.rate);
  const nextAmount = patch.amount != null ? n(patch.amount) : nextQty * nextRate;

  const nextFuelType =
    patch.fuelType != null ? String(patch.fuelType).trim() : String(existing.fuelType);

  const nextPurchaseType =
    patch.purchaseType != null ? patch.purchaseType : existing.purchaseType;

  const nextVehicleNumber =
    patch.vehicleNumber != null ? String(patch.vehicleNumber).trim() : String(existing.vehicleNumber);

  const nextVehicleName =
    patch.vehicleName != null ? String(patch.vehicleName).trim() : existing.vehicleName;

  const nextThrough =
    patch.through != null ? String(patch.through).trim() : existing.through;

  const nextSlipNo =
    patch.slipNo != null ? String(patch.slipNo).trim() : existing.slipNo;

  const nextRemarks =
    patch.remarks != null ? String(patch.remarks).trim() : existing.remarks;

  const nextEntryDate =
    patch.entryDate != null ? new Date(patch.entryDate) : existing.entryDate;

  const expenseTitle = buildExpenseTitle(nextFuelType);
  const expenseSummary = buildExpenseSummary({
    fuelStationName: existing.ledger?.name || "Fuel Station",
    fuelType: nextFuelType,
    purchaseType: String(nextPurchaseType),
    vehicleNumber: nextVehicleNumber,
    vehicleName: nextVehicleName,
    through: nextThrough,
    slipNo: nextSlipNo,
    remarks: nextRemarks,
  });

  return prisma.$transaction(async (pr) => {
    // 1) update linked SiteExpense
    if (existing.siteExpenseId) {
      await pr.siteExpense.update({
        where: { id: existing.siteExpenseId },
        data: {
          expenseDate: nextEntryDate,
          expenseTitle,
          summary: expenseSummary,
          paymentDetails: nextThrough || null,
          amount: nextAmount as any,
        },
      });
    }

    // 2) update FuelStationLedger
    const updated = await pr.fuelStationLedger.update({
      where: { id },
      data: {
        entryDate: nextEntryDate,

        slipNo: nextSlipNo || null,
        through: nextThrough || null,
        purchaseType: nextPurchaseType as any,

        vehicleNumber: nextVehicleNumber,
        vehicleName: nextVehicleName || null,

        fuelType: nextFuelType,
        qty: nextQty as any,
        rate: nextRate as any,
        amount: nextAmount as any,

        remarks: nextRemarks || null,
      },
      include: {
        site: { select: { id: true, siteName: true } },
        ledger: { select: { id: true, name: true } },
      },
    });

    return updated;
  });
}

/**
 * ✅ HARD DELETE
 * - deletes linked SiteExpense also
 */
export async function deleteOne(id: string) {
  const row = await prisma.fuelStationLedger.findUnique({
    where: { id },
    select: { id: true, siteExpenseId: true },
  });

  if (!row) return;

  await prisma.$transaction(async (pr) => {
    if (row.siteExpenseId) {
      await pr.siteExpense.delete({ where: { id: row.siteExpenseId } });
      return;
    }
    await pr.fuelStationLedger.delete({ where: { id: row.id } });
  });
}
