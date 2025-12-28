import { Request, Response } from "express";
import { prisma } from "../../config/db";

export async function getProfile(req: any, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  return res.json(user);
}
