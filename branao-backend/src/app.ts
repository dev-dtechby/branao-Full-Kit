import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import errorMiddleware from "./middleware/error.middleware";

// Import all routes
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan("dev"));

// API Prefix
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Error Handler
app.use(errorMiddleware);

export default app;
