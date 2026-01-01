import express from "express";
import cors from "cors";
import morgan from "morgan";

// Routes
import siteRoutes from "./modules/site/site.routes";
import departmentRoutes from "./modules/department/department.routes";
import siteExpRoutes from "./modules/site-exp/site-exp.routes";
import auditLogRoutes from "./modules/audit-log/audit-log.routes"; // ✅ ADD THIS

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
// Middlewares
// ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// ====================
// Health Check
// ====================
app.get("/", (_req, res) => {
  res.status(200).send("🚀 Branao Backend API Running");
});

// ====================
// API Routes
// ====================
app.use("/api/sites", siteRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/site-exp", siteExpRoutes);
app.use("/api/audit-log", auditLogRoutes); // ✅ THIS FIXES EVERYTHING

// ====================
// 404 Handler
// ====================
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;
