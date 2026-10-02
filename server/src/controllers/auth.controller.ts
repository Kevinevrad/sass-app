import { Response, Request, NextFunction } from "express";
import { registerUser, loginUser } from "../services/auth.service";

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, companyName } = req.body;
    if (!name || !email || !password || !companyName) {
      return res.status(400).json({ error: "MISSING_FIELDS" });
    }

    const result = await registerUser({ name, email, password, companyName });
    return res.status(201).json(result);
  } catch (error: any) {
    if (error.message === "EMAIL_ALREADY_USED") {
      return res.status(409).json({ error: "EMAIL_ALREADY_USED" });
    }
    return res
      .status(500)
      .json({ error: "SERVER_ERROR", message: error.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });
    return res.json(result);
  } catch (error: any) {
    if (error.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ error: "INVALID_CREDENTIALS" });
    }
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
