import prisma from "../../lib/prisma";
import cloudinary from "../../config/cloudinary";

/* =====================================================
   CLOUDINARY UPLOAD
===================================================== */
async function uploadToCloudinary(file: Express.Multer.File) {
  return new Promise<any>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "branao/sites" }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      })
      .end(file.buffer);
  });
}

/* =====================================================
   CREATE SITE
===================================================== */
export async function createSite(data: any, files: any) {
  const site = await prisma.site.create({
    data: {
      siteName: data.siteName,
      tenderNo: data.tenderNo || null,
      sdAmount: data.sdAmount ? Number(data.sdAmount) : null,
      departmentId: data.departmentId || null,

      estimate: {
        create: {
          cement: data.cement ? Number(data.cement) : null,
          metal: data.metal ? Number(data.metal) : null,
          sand: data.sand ? Number(data.sand) : null,
          labour: data.labour ? Number(data.labour) : null,
          royalty: data.royalty ? Number(data.royalty) : null,
          overhead: data.overhead ? Number(data.overhead) : null,
          lead: data.lead ? Number(data.lead) : null,
          dressing: data.dressing ? Number(data.dressing) : null,
          waterCompaction: data.waterCompaction
            ? Number(data.waterCompaction)
            : null,
          loading: data.loading ? Number(data.loading) : null,
        },
      },
    },
  });

  await uploadDocuments(site.id, files);
  return site;
}

/* =====================================================
   GET SITE BY ID (EDIT LOAD)
===================================================== */
export async function getSiteById(id: string) {
  const site = await prisma.site.findFirst({
    where: { id, isDeleted: false },
    include: {
      department: { select: { id: true, name: true } },
      estimate: true,
      documents: true,
    },
  });

  if (!site) return null;

  const getSingleDoc = (type: "SD" | "WORK_ORDER") =>
    site.documents.find((d) => d.type === type) || null;

  return {
    id: site.id,
    siteName: site.siteName,
    tenderNo: site.tenderNo,
    sdAmount: site.sdAmount,

    department: site.department,
    estimates: site.estimate, // 🔥 frontend uses this

    sdFile: getSingleDoc("SD"),
    workOrderFile: getSingleDoc("WORK_ORDER"),
    tenderDocs: site.documents.filter((d) => d.type === "TENDER"),
  };
}

/* =====================================================
   UPDATE SITE (EDIT SAVE)
===================================================== */
export async function updateSite(id: string, data: any, files: any) {
  await prisma.site.update({
    where: { id },
    data: {
      siteName: data.siteName,
      tenderNo: data.tenderNo || null,
      sdAmount: data.sdAmount ? Number(data.sdAmount) : null,
      departmentId: data.departmentId || null,

      estimate: {
        update: {
          cement:
            data.cement !== undefined ? Number(data.cement) : undefined,
          metal:
            data.metal !== undefined ? Number(data.metal) : undefined,
          sand:
            data.sand !== undefined ? Number(data.sand) : undefined,
          labour:
            data.labour !== undefined ? Number(data.labour) : undefined,
          royalty:
            data.royalty !== undefined ? Number(data.royalty) : undefined,
          overhead:
            data.overhead !== undefined ? Number(data.overhead) : undefined,
          lead:
            data.lead !== undefined ? Number(data.lead) : undefined,
          dressing:
            data.dressing !== undefined ? Number(data.dressing) : undefined,
          waterCompaction:
            data.waterCompaction !== undefined
              ? Number(data.waterCompaction)
              : undefined,
          loading:
            data.loading !== undefined ? Number(data.loading) : undefined,
        },
      },
    },
  });

  await uploadDocuments(id, files);
}

/* =====================================================
   UPLOAD DOCUMENTS (COMMON)
===================================================== */
async function uploadDocuments(siteId: string, files: any) {
  if (files?.sdFile?.length) {
    const r = await uploadToCloudinary(files.sdFile[0]);
    await prisma.siteDocument.create({
      data: {
        siteId,
        type: "SD",
        secureUrl: r.secure_url,
        publicId: r.public_id,
        resourceType: r.resource_type,
      },
    });
  }

  if (files?.workOrderFile?.length) {
    const r = await uploadToCloudinary(files.workOrderFile[0]);
    await prisma.siteDocument.create({
      data: {
        siteId,
        type: "WORK_ORDER",
        secureUrl: r.secure_url,
        publicId: r.public_id,
        resourceType: r.resource_type,
      },
    });
  }

  if (files?.tenderDocs?.length) {
    for (const file of files.tenderDocs) {
      const r = await uploadToCloudinary(file);
      await prisma.siteDocument.create({
        data: {
          siteId,
          type: "TENDER",
          secureUrl: r.secure_url,
          publicId: r.public_id,
          resourceType: r.resource_type,
        },
      });
    }
  }
}
