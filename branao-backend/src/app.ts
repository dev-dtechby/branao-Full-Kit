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

      return callback(new Error("CORS not allowed: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ====================
// MIDDLEWARES
// ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
