import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../libs/prisma";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");

const option: SignOptions = {
  expiresIn: "7d",
};

function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, option);
}

export async function registerUser(params: {
  name: string;
  email: string;
  password: string;
  companyName: string;
}) {
  //
  //    VERIFICATION DE L'EXISTENCE
  //    DE L'UTILISATEUR AVANT ENREIGISTREMENT
  //
  const existing = await prisma.orm.public.User.where({
    email: params.email,
  }).first();

  if (existing) throw new Error("EMAIL_ALREADY_USED");

  //
  //    NOUVEL UTILISATEUR
  //

  // HASCHAGE DU PASSWORD PASSE EN PARAM
  const passwordHash = await bcrypt.hash(params.password, 10);

  // CREATION DE LA TRANSACTION (TOUT OU RIEN)

  const result = await prisma.transaction(async (tx) => {
    const user = await tx.orm.public.User.create({
      email: params.email,
      name: params.name,
      passwordHash,
    });

    const company = await tx.orm.public.Company.create({
      name: params.companyName,
    });

    await tx.orm.public.Membership.create({
      userId: user.id,
      companyId: company.id,
      role: "OWNER",
    });
    return {
      user,
      company,
    };
  });
  const token = generateToken(result.user.id);
  return { token, user: result.user, company: result.company };
}

export async function loginUser(params: { email: string; password: string }) {
  const user = await prisma.orm.public.User.where({
    email: params.email,
  }).first();

  if (!user) throw new Error("INVALID_CREDENTIALS");

  const passwordMatcheds = await bcrypt.compare(
    params.password,
    user.passwordHash,
  );

  if (!passwordMatcheds) throw new Error("INVALID_CREDENTIALS");

  const token = generateToken(user.id);
  return { token, user };
}
