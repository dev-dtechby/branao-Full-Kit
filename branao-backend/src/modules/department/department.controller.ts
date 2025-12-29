import { Request, Response } from "express";
import * as service from "./department.service";

/* ================================
   GET ALL
================================ */
export const getDepartments = async (_req: Request, res: Response) => {
  try {
    const data = await service.getAllDepartments();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get Department Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
    });
  }
};

/* ================================
   CREATE
================================ */
export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    const department = await service.createDepartment(name);

    res.status(201).json({
      success: true,
      data: department,
    });
  } catch (error: any) {
    console.error("Create Department Error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Department create failed",
    });
  }
};

/* ================================
   DELETE
================================ */
export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await service.deleteDepartment(id);

    res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("Delete Department Error:", error);
    res.status(500).json({
      success: false,
      message: "Department delete failed",
    });
  }
};
