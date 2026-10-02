import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");

export interface AuthRequest extends Request {
  userId?: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "MISSING_TOKEN" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "MISSING_TOKEN" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (typeof payload === "string" || typeof payload.userId !== "string") {
      return res.status(401).json({ error: "INVALID_TOKEN" });
    }

    (req as AuthRequest).userId = payload.userId;

    return next();
  } catch (error) {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }
}
