import prisma from "../../lib/prisma";

/* ================================
   GET ALL DEPARTMENTS
================================ */
export const getAllDepartments = async () => {
  return prisma.department.findMany({
    orderBy: { name: "asc" },
  });
};

/* ================================
   CREATE DEPARTMENT
================================ */
export const createDepartment = async (name: string) => {
  if (!name || !name.trim()) {
    throw new Error("Department name is required");
  }

  return prisma.department.create({
    data: {
      name: name.trim(),
    },
  });
};

/* ================================
   DELETE DEPARTMENT
================================ */
export const deleteDepartment = async (id: string) => {
  return prisma.department.delete({
    where: { id },
  });
};
