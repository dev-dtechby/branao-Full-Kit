import { Request, Response } from "express";
import { prisma } from "../../config/db";
import { hashPassword, comparePassword } from "../../utils/password";
import { signToken } from "../../utils/jwt";

// POST /register
export async function register(req: Request, res: Response) {
  try {
    const { name, phone, password, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) return res.status(400).json({ message: "User exists" });

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: { name, phone, password: hashed, role },
    });

    return res.json({ message: "User registered", user });
  } catch (error) {
    return res.status(500).json({ error });
  }
}

// POST /login
export async function login(req: Request, res: Response) {
  try {
    const { phone, password } = req.body;

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Wrong password" });

    const token = signToken({ id: user.id, role: user.role });

    return res.json({ token, user });
  } catch (error) {
    return res.status(500).json({ error });
  }
}
