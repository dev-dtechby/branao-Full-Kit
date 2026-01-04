import prisma from "../../lib/prisma";

export const materialMasterService = {
  getActive: async () => {
    return prisma.materialMaster.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
    });
  },

  getDeleted: async () => {
    return prisma.materialMaster.findMany({
      where: { isDeleted: true },
      orderBy: { deletedAt: "desc" },
    });
  },

  create: async (name: string) => {
    return prisma.materialMaster.create({
      data: { name },
    });
  },

  update: async (id: string, name: string) => {
    return prisma.materialMaster.update({
      where: { id },
      data: { name },
    });
  },

  softDelete: async (id: string, deletedBy?: string | null) => {
    return prisma.materialMaster.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: deletedBy || null,
      },
    });
  },

  restore: async (id: string) => {
    return prisma.materialMaster.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      },
    });
  },

  hardDelete: async (id: string) => {
    return prisma.materialMaster.delete({
      where: { id },
    });
  },
};
