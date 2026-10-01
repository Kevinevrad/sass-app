import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { prisma } from "../libs/prisma";

const JWT_SECRET = process.env.JWT_SECRET!;

/** Durée par défaut du jeton si `JWT_EXPIRES_IN` est absent ou vide. */
const DEFAULT_JWT_EXPIRE = "7d";

/**
 * Formes acceptées par `ms` (la dépendance de `jsonwebtoken`) : un nombre de
 * secondes seul, ou un nombre suivi d'une unité (`d`, `days`, `h`, `ms`, ...).
 * Le séparateur peut être un espace et la casse de l'unité est libre.
 */
const EXPIRES_IN_PATTERN = /^\d+(\.\d+)?\s*[a-z]*$/i;

/**
 * `process.env` est typé `string | undefined` alors que `SignOptions["expiresIn"]`
 * attend un `ms.StringValue` (un template literal) ou un nombre de secondes : la
 * valeur brute ne compile donc pas (TS2769), et `ms()` lèverait à l'exécution sur
 * une durée mal formée. La validation ci-dessous est ce qui rend le cast final
 * sûr : le type reflète un contrôle réellement exécuté, pas un `as` nu.
 *
 * @param value Valeur brute de `JWT_EXPIRES_IN`.
 * @returns La durée validée, ou la durée par défaut si `value` est absent.
 * @throws Si `value` est renseignée mais n'est pas une durée exploitable.
 */
function parseExpiresIn(
  value: string | undefined,
): NonNullable<SignOptions["expiresIn"]> {
  const raw = value?.trim() || DEFAULT_JWT_EXPIRE;

  if (!EXPIRES_IN_PATTERN.test(raw)) {
    throw new Error(`JWT_EXPIRES_IN_INVALID:${raw}`);
  }

  return raw as NonNullable<SignOptions["expiresIn"]>;
}

const JWT_EXPIRE = parseExpiresIn(process.env.JWT_EXPIRES_IN);

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

function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
    // Algorithme épinglé : évite toute dépendance à l'implémentation par défaut
    // de `jsonwebtoken` au moment de la signature.
    algorithm: "HS256",
  });
}
