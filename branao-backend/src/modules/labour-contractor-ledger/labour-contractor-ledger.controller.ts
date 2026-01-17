import { Request, Response } from "express";
import * as s from "./labour-contractor-ledger.service";

const toNum = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export const listContractors = async (_req: Request, res: Response) => {
  const data = await s.listContractors();
  res.json({ success: true, count: data.length, data });
};

export const createContractor = async (req: Request, res: Response) => {
  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ success: false, message: "Name required" });

  const data = await s.createContractor(req.body);
  res.status(201).json({ success: true, data });
};

export const updateContractor = async (req: Request, res: Response) => {
  const data = await s.updateContractor(req.params.id, req.body);
  res.json({ success: true, data });
};

export const deleteContractorHard = async (req: Request, res: Response) => {
  await s.deleteContractorHard(req.params.id);
  res.json({ success: true, message: "Deleted permanently" });
};

/* ===================== CONTRACTS ===================== */

export const listContracts = async (req: Request, res: Response) => {
  const data = await s.listContracts({
    contractorId: req.query.contractorId as string | undefined,
    siteId: req.query.siteId as string | undefined,
  });
  res.json({ success: true, count: data.length, data });
};

export const createContract = async (req: Request, res: Response) => {
  const contractorId = String(req.body?.contractorId || "").trim();
  const siteId = String(req.body?.siteId || "").trim();
  const agreedAmount = toNum(req.body?.agreedAmount);

  if (!contractorId || !siteId || agreedAmount === undefined) {
    return res.status(400).json({ success: false, message: "contractorId, siteId, agreedAmount required" });
  }
  if (agreedAmount < 0) {
    return res.status(400).json({ success: false, message: "agreedAmount must be >= 0" });
  }

  const data = await s.createContract(req.body, (req as any).file);
  res.status(201).json({ success: true, data });
};

export const updateContract = async (req: Request, res: Response) => {
  const data = await s.updateContract(req.params.id, req.body, (req as any).file);
  res.json({ success: true, data });
};

export const deleteContractHard = async (req: Request, res: Response) => {
  await s.deleteContractHard(req.params.id);
  res.json({ success: true, message: "Deleted permanently" });
};

/* ===================== PAYMENTS ===================== */

export const listPayments = async (req: Request, res: Response) => {
  const data = await s.listPayments({
    contractorId: req.query.contractorId as string | undefined,
    siteId: req.query.siteId as string | undefined,
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
  });
  res.json({ success: true, count: data.length, data });
};

export const createPayment = async (req: Request, res: Response) => {
  const contractorId = String(req.body?.contractorId || "").trim();
  const siteId = String(req.body?.siteId || "").trim();
  const paymentDate = String(req.body?.paymentDate || "").trim();
  const amount = toNum(req.body?.amount);

  if (!contractorId || !siteId || !paymentDate || amount === undefined) {
    return res.status(400).json({ success: false, message: "contractorId, siteId, paymentDate, amount required" });
  }
  if (amount <= 0) return res.status(400).json({ success: false, message: "amount must be > 0" });

  const data = await s.createPayment(req.body);
  res.status(201).json({ success: true, data });
};

export const updatePayment = async (req: Request, res: Response) => {
  const patch: any = { ...req.body };
  if (patch.amount !== undefined) {
    const amt = toNum(patch.amount);
    if (amt === undefined || amt <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }
    patch.amount = amt;
  }
  const data = await s.updatePayment(req.params.id, patch);
  res.json({ success: true, data });
};

export const deletePaymentHard = async (req: Request, res: Response) => {
  await s.deletePaymentHard(req.params.id);
  res.json({ success: true, message: "Deleted permanently" });
};

/* ===================== LEDGER SUMMARY ===================== */

export const getContractorLedger = async (req: Request, res: Response) => {
  const contractorId = req.params.contractorId;
  const siteId = (req.query.siteId as string | undefined) || undefined;

  const data = await s.getContractorLedger(contractorId, { siteId });
  res.json({ success: true, data });
};
