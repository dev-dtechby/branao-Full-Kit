import prisma from "../src/lib/prisma";

async function main() {
  // ✅ Default Ledger Types (add/remove as per your ERP)
  const ledgerTypes = [
    "MATERIAL_SUPPLIER",
    "STAFF",
    "FUEL_STATION",
    "TRANSPORTER",
    "VENDOR",
    "CLIENT",
    "OTHER",
  ];

  for (const name of ledgerTypes) {
    await prisma.ledgerType.upsert({
      where: { name },
      update: { isDeleted: false },
      create: { name },
    });
  }

  console.log("✅ Seed completed: LedgerTypes ensured");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
