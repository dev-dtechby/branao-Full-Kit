import prisma from "../../lib/prisma";

export const materialSupplierService = {
  getActive: async () => {
    return prisma.materialSupplier.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
    });
  },

  getDeleted: async () => {
    return prisma.materialSupplier.findMany({
      where: { isDeleted: true },
      orderBy: { deletedAt: "desc" },
    });
  },

  create: async (payload: { name: string; contactNo?: string; address?: string }) => {
    return prisma.materialSupplier.create({
      data: {
        name: payload.name,
        contactNo: payload.contactNo || null,
        address: payload.address || null,
      },
    });
  },

  update: async (
    id: string,
    payload: { name: string; contactNo?: string; address?: string }
  ) => {
    return prisma.materialSupplier.update({
      where: { id },
      data: {
        name: payload.name,
        contactNo: payload.contactNo || null,
        address: payload.address || null,
      },
    });
  },

  softDelete: async (id: string, deletedBy?: string | null) => {
    return prisma.materialSupplier.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: deletedBy || null,
      },
    });
  },

  restore: async (id: string) => {
    return prisma.materialSupplier.update({
      where: { id },
      data: { isDeleted: false, deletedAt: null, deletedBy: null },
    });
  },

  hardDelete: async (id: string) => {
    return prisma.materialSupplier.delete({ where: { id } });
  },
};
