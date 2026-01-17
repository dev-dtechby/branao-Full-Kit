import prisma from "../../lib/prisma";

type BulkRow = {
  rowKey?: string;

  entryDate?: string; // ISO (row-wise)
  through?: string | null;
  purchaseType: "OWN_VEHICLE" | "RENT_VEHICLE";

  vehicleNumber: string;
  vehicleName?: string | null;

  fuelType: string;
  qty: number | string;
  rate: number | string;

  slipNo?: string | null;
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

export async function getLedger(filters: {
  fuelStationId?: string;
  siteId?: string;
}) {
  return prisma.fuelStationLedger.findMany({
    where: {
      fuelStationId: filters.fuelStationId,
      siteId: filters.siteId,
    },
    include: {
      site: { select: { id: true, siteName: true } },
      fuelStation: { select: { id: true, name: true } },
    },
    orderBy: { entryDate: "asc" },
  });
}

export async function createBulk(input: {
  fuelStationId: string;
  siteId: string;
  entryDate?: string; // fallback
  rows: BulkRow[];
}) {
  const fuelStation = await prisma.fuelStation.findUnique({
    where: { id: input.fuelStationId },
    select: { name: true },
  });

  if (!fuelStation) throw new Error("Fuel station not found");

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

      const purchaseType = r.purchaseType;
      if (!purchaseType) throw new Error("purchaseType required");

      // 1) create SiteExpense (linked)
      const expenseTitle = buildExpenseTitle(fuelType);
      const expenseSummary = buildExpenseSummary({
        fuelStationName: fuelStation.name,
        fuelType,
        purchaseType,
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
      });

      // 2) create FuelStationLedger row
      const ledgerRow = await pr.fuelStationLedger.create({
        data: {
          fuelStationId: input.fuelStationId,
          siteId: input.siteId,
          siteExpenseId: siteExpense.id,

          entryDate,

          through: r.through ? String(r.through).trim() : null,
          purchaseType: purchaseType as any,

          vehicleNumber,
          vehicleName: r.vehicleName ? String(r.vehicleName).trim() : null,

          fuelType,
          qty: qty as any,
          rate: rate as any,
          amount: amount as any,

          slipNo: r.slipNo ? String(r.slipNo).trim() : null,
          remarks: r.remarks ? String(r.remarks).trim() : null,
        },
        include: {
          site: { select: { id: true, siteName: true } },
          fuelStation: { select: { id: true, name: true } },
        },
      });

      created.push(ledgerRow);
    }

    return created;
  });

  return { count: tx.length, data: tx };
}

export async function updateOne(id: string, patch: any) {
  // load current
  const existing = await prisma.fuelStationLedger.findUnique({
    where: { id },
    include: {
      fuelStation: { select: { name: true } },
      siteExpense: { select: { id: true } },
    },
  });

  if (!existing) throw new Error("Row not found");

  const nextQty = patch.qty != null ? n(patch.qty) : n(existing.qty);
  const nextRate = patch.rate != null ? n(patch.rate) : n(existing.rate);
  const nextAmount =
    patch.amount != null ? n(patch.amount) : nextQty * nextRate;

  const nextFuelType =
    patch.fuelType != null ? String(patch.fuelType).trim() : existing.fuelType;

  const nextPurchaseType =
    patch.purchaseType != null ? patch.purchaseType : existing.purchaseType;

  const nextVehicleNumber =
    patch.vehicleNumber != null
      ? String(patch.vehicleNumber).trim()
      : existing.vehicleNumber;

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
    fuelStationName: existing.fuelStation?.name || "Fuel Station",
    fuelType: nextFuelType,
    purchaseType: String(nextPurchaseType),
    vehicleNumber: nextVehicleNumber,
    vehicleName: nextVehicleName,
    through: nextThrough,
    slipNo: nextSlipNo,
    remarks: nextRemarks,
  });

  return prisma.$transaction(async (pr) => {
    // 1) update SiteExpense (if linked)
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

    // 2) update ledger row
    const updated = await pr.fuelStationLedger.update({
      where: { id },
      data: {
        entryDate: nextEntryDate,

        through: nextThrough || null,
        purchaseType: nextPurchaseType as any,

        vehicleNumber: nextVehicleNumber,
        vehicleName: nextVehicleName || null,

        fuelType: nextFuelType,
        qty: nextQty as any,
        rate: nextRate as any,
        amount: nextAmount as any,

        slipNo: nextSlipNo || null,
        remarks: nextRemarks || null,
      },
      include: {
        site: { select: { id: true, siteName: true } },
        fuelStation: { select: { id: true, name: true } },
      },
    });

    return updated;
  });
}

export async function deleteOne(id: string) {
  const row = await prisma.fuelStationLedger.findUnique({
    where: { id },
    select: { id: true, siteExpenseId: true },
  });
  if (!row) return;

  // Hard delete (your preference)
  await prisma.$transaction(async (pr) => {
    // delete linked SiteExpense first (will cascade ledger if schema relation set)
    if (row.siteExpenseId) {
      await pr.siteExpense.delete({ where: { id: row.siteExpenseId } });
      return;
    }
    await pr.fuelStationLedger.delete({ where: { id: row.id } });
  });
}
