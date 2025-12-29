import { Router } from "express";
import {
  getDepartments,
  createDepartment,
  deleteDepartment,
} from "./department.controller";

const router = Router();

/* ================================
   ROUTES
================================ */

// GET ALL
router.get("/", getDepartments);

// CREATE
router.post("/", createDepartment);

// DELETE
router.delete("/:id", deleteDepartment);

export default router;
