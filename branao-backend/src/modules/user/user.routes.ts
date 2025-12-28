import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { getProfile } from "./user.controller";

const router = Router();

router.get("/me", authMiddleware, getProfile);

export default router;
