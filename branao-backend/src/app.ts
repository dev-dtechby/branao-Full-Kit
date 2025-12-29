import express from "express";
import cors from "cors";
import morgan from "morgan";

import siteRoutes from "./modules/site/site.routes";

const app = express();

// ====================
// ✅ CORS (IMPORTANT)
// ====================
app.use(
  cors({
    origin: ["http://localhost:3000"], // Next.js frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
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
  res.send("🚀 Branao Backend API Running");
});

// ====================
// Routes
// ====================
app.use("/api/sites", siteRoutes);

// ====================
// 404 Handler
// ====================
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;
