import dotenv from "dotenv";

dotenv.config();

export const ENV = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV || "development",

  DATABASE_URL: process.env.DATABASE_URL as string,

  JWT_SECRET: process.env.JWT_SECRET as string,

  CLOUDINARY_CLOUD: process.env.CLOUDINARY_CLOUD_NAME as string,
  CLOUDINARY_KEY: process.env.CLOUDINARY_API_KEY as string,
  CLOUDINARY_SECRET: process.env.CLOUDINARY_API_SECRET as string,
};
