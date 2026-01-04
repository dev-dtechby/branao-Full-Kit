// D:\Projects\branao.in\clone\branao-Full-Kit\branao-backend\src\app.ts
import express from "express";
import cors from "cors";
import morgan from "morgan";

// ====================
// ROUTES
// ====================
import siteRoutes from "./modules/site/site.routes";
import departmentRoutes from "./modules/department/department.routes";
import siteExpRoutes from "./modules/site-exp/site-exp.routes";
import auditLogRoutes from "./modules/audit-log/audit-log.routes";
import siteProfitRoutes from "./modules/site-profit/site-profit.routes";
import voucherRoutes from "./modules/voucher/voucher.routes";
import ledgerTypeRoutes from "./modules/ledger-type/ledger-type.routes";
import ledgerRoutes from "./modules/ledger/ledger.routes";
import staffExpenseRoutes from "./modules/staff-expense/staff-expense.routes";
import materialMasterRoutes from "./modules/material-master/material-master.routes";
import materialSupplierRoutes from "./modules/material-supplier/material-supplier.routes";
import siteTransactionRoutes from "./modules/site-transaction/site-transaction.routes";

const app = express();

// ====================
// ✅ CORS (LOCAL + PROD)
// ====================
const allowedOrigins = [
  "http://localhost:3000",
  "https://branao.in",
  "https://www.branao.in",
  "https://branao.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server / Postman / curl
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed: " + origin), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ====================
// ✅ Disable caching (Fix 304 / stale data)
// ====================
// ETag off
app.disable("etag");

// No-store headers for every response
app.use((_req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

// ====================
// MIDDLEWARES
// ====================
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(morgan("dev"));

// ====================
// HEALTH CHECK
// ====================
app.get("/", (_req, res) => {
  res.status(200).send("🚀 Branao Backend API Running");
});

// ====================
// API ROUTES
// ====================
app.use("/api/sites", siteRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/site-exp", siteExpRoutes);
app.use("/api/audit-log", auditLogRoutes);
app.use("/api/site-profit", siteProfitRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/ledger-types", ledgerTypeRoutes);
app.use("/api/ledgers", ledgerRoutes);
app.use("/api/staff-expense", staffExpenseRoutes);
app.use("/api/material-master", materialMasterRoutes);
app.use("/api/material-suppliers", materialSupplierRoutes);
app.use("/api/site-transactions", siteTransactionRoutes);

// ====================
// 404 HANDLER
// ====================
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;
