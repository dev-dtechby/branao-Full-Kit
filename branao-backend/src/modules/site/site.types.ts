import { Request } from "express";

export type MulterFiles = {
  sdFile?: Express.Multer.File[];
  workOrderFile?: Express.Multer.File[];
  tenderDocs?: Express.Multer.File[];
};

export type SiteRequest = Request & {
  files: MulterFiles;
};
