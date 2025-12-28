import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default {
  createSite: async (data: any) => {
    return await prisma.site.create({
      data: {
        name: data.name,
        location: data.location || null,
        address: data.address || null,
      },
    });
  },

  getSites: async () => {
    return await prisma.site.findMany({
      orderBy: { id: "desc" },
    });
  },

  getSiteById: async (id: number) => {
    const site = await prisma.site.findUnique({ where: { id } });
    if (!site) throw new Error("Site not found");
    return site;
  },

  updateSite: async (id: number, data: any) => {
    return await prisma.site.update({
      where: { id },
      data: {
        name: data.name,
        location: data.location,
        address: data.address,
        status: data.status,
      },
    });
  },

  removeSite: async (id: number) => {
    const site = await prisma.site.findUnique({ where: { id } });
    if (!site) throw new Error("Site not found");

    return await prisma.site.update({
      where: { id },
      data: { status: "INACTIVE" },
    });
  },
};
