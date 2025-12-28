import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

export function signToken(payload: any, expires = "7d") {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: expires });
}

export function verifyToken(token: string) {
  return jwt.verify(token, ENV.JWT_SECRET);
}
