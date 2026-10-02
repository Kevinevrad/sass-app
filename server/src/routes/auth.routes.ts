import { Router } from "express";
import { register, login } from "../controllers/auth.controller";
import { requireAuth, AuthRequest } from "../middlewares/auth.middleware";
import { prisma } from "../libs/prisma";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.orm.public.User.where({ id: req.userId }).first();
  res.json(user);
});
export default router;
