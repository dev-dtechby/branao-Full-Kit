import fs from "fs";
import prisma from "../../lib/prisma";
import { v2 as cloudinary } from "cloudinary";

/* =========================
   Cloudinary Config
========================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

function toOptionalDecimal(v: any) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

function toRequiredDecimal(v: any, fallback = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

async function safeUnlink(filePath?: string) {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // ignore
  }
}

async function uploadToCloudinary(file: Express.Multer.File, folder: string) {
  if (!file?.path) throw new Error("file path missing for upload");
  const res = await cloudinary.uploader.upload(file.path, {
    folder,
    resource_type: "image",
  });
  return res.secure_url; // ✅ store this in DB
}

/* =========================
   GET Ledger
========================= */
export const getLedger = async (ledgerId: string, siteId?: string | null) => {
  return prisma.materialSupplierLedger.findMany({
    where: {
      ledgerId,
      ...(siteId ? { siteId } : {}),
    },
    orderBy: { entryDate: "desc" },
  });
};

/* =========================
   BULK CREATE
========================= */
export const createBulk = async (args: {
  entryDate: string;
  ledgerId: string;
  siteId: string | null;
  rows: any[];
  unloadingFiles: Express.Multer.File[];
  receiptFiles: Express.Multer.File[];
}) => {
  const { entryDate, ledgerId, siteId, rows, unloadingFiles, receiptFiles } = args;

  const dt = new Date(entryDate);
  if (isNaN(dt.getTime())) throw new Error("Invalid entryDate");
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("rows required");
  if (!ledgerId) throw new Error("ledgerId required");

  if (unloadingFiles.length !== rows.length || receiptFiles.length !== rows.length) {
    throw new Error("Files count must match rows count");
  }

  const uploadedVehicleUrls: string[] = [];
  const uploadedReceiptUrls: string[] = [];

  try {
    for (let i = 0; i < rows.length; i++) {
      const vFile = unloadingFiles[i];
      const rFile = receiptFiles[i];

      const vehicleUrl = await uploadToCloudinary(vFile, "material-ledger/vehicle");
      const receiptUrl = await uploadToCloudinary(rFile, "material-ledger/receipt");

      uploadedVehicleUrls.push(vehicleUrl);
      uploadedReceiptUrls.push(receiptUrl);

      await safeUnlink(vFile?.path);
      await safeUnlink(rFile?.path);
    }

    const created = await prisma.$transaction(async (tx) => {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];

        const rate = toRequiredDecimal(r?.rate, 0);

        await tx.materialSupplierLedger.create({
          data: {
            entryDate: dt,

            receiptNo: r?.receiptNo ? String(r.receiptNo) : null,
            parchiPhoto: uploadedReceiptUrls[i], // ✅ Cloudinary URL
            otp: r?.otp ? String(r.otp) : null,

            vehicleNo: r?.vehicleNo ? String(r.vehicleNo) : null,
            vehiclePhoto: uploadedVehicleUrls[i], // ✅ Cloudinary URL

            material: String(r?.material || "").trim(),
            size: r?.size ? String(r.size) : null,

            qty: toRequiredDecimal(r?.qty, 0),
            rate: rate,

            royaltyQty: toOptionalDecimal(r?.royaltyQty),
            royaltyRate: toOptionalDecimal(r?.royaltyRate),
            royaltyAmt: toOptionalDecimal(r?.royaltyAmt),

            gstPercent: toOptionalDecimal(r?.gstPercent),
            taxAmt: toOptionalDecimal(r?.taxAmt),
            totalAmt: toOptionalDecimal(r?.totalAmt),

            paymentAmt: toOptionalDecimal(r?.paymentAmt),
            balanceAmt: toOptionalDecimal(r?.balanceAmt),

            remarks: r?.remarks ? String(r.remarks) : null,

            ledgerId,
            siteId: siteId || null,
          },
        });
      }
      return { count: rows.length };
    });

    return created;
  } catch (e) {
    for (const f of unloadingFiles) await safeUnlink(f?.path);
    for (const f of receiptFiles) await safeUnlink(f?.path);
    throw e;
  }
};

/* =========================
   SINGLE UPDATE (JSON)
========================= */
export const updateOne = async (id: string, body: any) => {
  const existing = await prisma.materialSupplierLedger.findUnique({ where: { id } });
  if (!existing) throw new Error("Record not found");

  const entryDate = body?.entryDate ? new Date(body.entryDate) : null;
  if (body?.entryDate && isNaN(entryDate!.getTime())) {
    throw new Error("Invalid entryDate");
  }

  return prisma.materialSupplierLedger.update({
    where: { id },
    data: {
      entryDate: entryDate ? entryDate : undefined,
      siteId: body?.siteId !== undefined ? (body.siteId || null) : undefined,

      receiptNo: body?.receiptNo !== undefined ? (body.receiptNo ? String(body.receiptNo) : null) : undefined,
      parchiPhoto: body?.parchiPhoto !== undefined ? (body.parchiPhoto ? String(body.parchiPhoto) : null) : undefined,
      otp: body?.otp !== undefined ? (body.otp ? String(body.otp) : null) : undefined,

      vehicleNo: body?.vehicleNo !== undefined ? (body.vehicleNo ? String(body.vehicleNo) : null) : undefined,
      vehiclePhoto: body?.vehiclePhoto !== undefined ? (body.vehiclePhoto ? String(body.vehiclePhoto) : null) : undefined,

      material: body?.material !== undefined ? String(body.material || "").trim() : undefined,
      size: body?.size !== undefined ? (body.size ? String(body.size) : null) : undefined,

      qty: body?.qty !== undefined ? toRequiredDecimal(body.qty, 0) : undefined,
      rate: body?.rate !== undefined ? toRequiredDecimal(body.rate, 0) : undefined,

      royaltyQty: body?.royaltyQty !== undefined ? toOptionalDecimal(body.royaltyQty) : undefined,
      royaltyRate: body?.royaltyRate !== undefined ? toOptionalDecimal(body.royaltyRate) : undefined,
      royaltyAmt: body?.royaltyAmt !== undefined ? toOptionalDecimal(body.royaltyAmt) : undefined,

      gstPercent: body?.gstPercent !== undefined ? toOptionalDecimal(body.gstPercent) : undefined,
      taxAmt: body?.taxAmt !== undefined ? toOptionalDecimal(body.taxAmt) : undefined,
      totalAmt: body?.totalAmt !== undefined ? toOptionalDecimal(body.totalAmt) : undefined,

      paymentAmt: body?.paymentAmt !== undefined ? toOptionalDecimal(body.paymentAmt) : undefined,
      balanceAmt: body?.balanceAmt !== undefined ? toOptionalDecimal(body.balanceAmt) : undefined,

      remarks: body?.remarks !== undefined ? (body.remarks ? String(body.remarks) : null) : undefined,
    },
  });
};

/* =========================
   BULK UPDATE: rows = [{id, ...fields}]
========================= */
export const bulkUpdate = async (rows: any[]) => {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("rows required");

  const result = await prisma.$transaction(async (tx) => {
    for (const r of rows) {
      const id = String(r?.id || "");
      if (!id) throw new Error("Row id missing in bulk update");

      const existing = await tx.materialSupplierLedger.findUnique({ where: { id } });
      if (!existing) throw new Error(`Record not found: ${id}`);

      const entryDate = r?.entryDate ? new Date(r.entryDate) : null;
      if (r?.entryDate && isNaN(entryDate!.getTime())) {
        throw new Error(`Invalid entryDate for id ${id}`);
      }

      await tx.materialSupplierLedger.update({
        where: { id },
        data: {
          entryDate: entryDate ? entryDate : undefined,
          siteId: r?.siteId !== undefined ? (r.siteId || null) : undefined,

          receiptNo: r?.receiptNo !== undefined ? (r.receiptNo ? String(r.receiptNo) : null) : undefined,
          parchiPhoto: r?.parchiPhoto !== undefined ? (r.parchiPhoto ? String(r.parchiPhoto) : null) : undefined,
          otp: r?.otp !== undefined ? (r.otp ? String(r.otp) : null) : undefined,

          vehicleNo: r?.vehicleNo !== undefined ? (r.vehicleNo ? String(r.vehicleNo) : null) : undefined,
          vehiclePhoto: r?.vehiclePhoto !== undefined ? (r.vehiclePhoto ? String(r.vehiclePhoto) : null) : undefined,

          material: r?.material !== undefined ? String(r.material || "").trim() : undefined,
          size: r?.size !== undefined ? (r.size ? String(r.size) : null) : undefined,

          qty: r?.qty !== undefined ? toRequiredDecimal(r.qty, 0) : undefined,
          rate: r?.rate !== undefined ? toRequiredDecimal(r.rate, 0) : undefined,

          royaltyQty: r?.royaltyQty !== undefined ? toOptionalDecimal(r.royaltyQty) : undefined,
          royaltyRate: r?.royaltyRate !== undefined ? toOptionalDecimal(r.royaltyRate) : undefined,
          royaltyAmt: r?.royaltyAmt !== undefined ? toOptionalDecimal(r.royaltyAmt) : undefined,

          gstPercent: r?.gstPercent !== undefined ? toOptionalDecimal(r.gstPercent) : undefined,
          taxAmt: r?.taxAmt !== undefined ? toOptionalDecimal(r.taxAmt) : undefined,
          totalAmt: r?.totalAmt !== undefined ? toOptionalDecimal(r.totalAmt) : undefined,

          paymentAmt: r?.paymentAmt !== undefined ? toOptionalDecimal(r.paymentAmt) : undefined,
          balanceAmt: r?.balanceAmt !== undefined ? toOptionalDecimal(r.balanceAmt) : undefined,

          remarks: r?.remarks !== undefined ? (r.remarks ? String(r.remarks) : null) : undefined,
        },
      });
    }
    return { count: rows.length };
  });

  return result;
};

/* =========================
   SINGLE DELETE (hard)
========================= */
export const deleteOne = async (id: string) => {
  const existing = await prisma.materialSupplierLedger.findUnique({ where: { id } });
  if (!existing) throw new Error("Record not found");
  await prisma.materialSupplierLedger.delete({ where: { id } });
  return true;
};

/* =========================
   BULK DELETE (hard)
========================= */
export const bulkDelete = async (ids: string[]) => {
  if (!Array.isArray(ids) || ids.length === 0) throw new Error("ids required");
  const r = await prisma.materialSupplierLedger.deleteMany({
    where: { id: { in: ids } },
  });
  return { count: r.count };
};
