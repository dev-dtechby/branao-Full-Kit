import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  CLOUDINARY_CLOUD: process.env.CLOUDINARY_CLOUD!,
  CLOUDINARY_KEY: process.env.CLOUDINARY_KEY!,
  CLOUDINARY_SECRET: process.env.CLOUDINARY_SECRET!,
};
