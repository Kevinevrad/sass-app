import type { PostgresClient } from "@prisma/orm-postgres/runtime";

import { db } from "../prisma/db";
import type { Contract } from "../prisma/contract.d";

/**
 * Point d'entrée unique vers la base de données pour toute l'application.
 *
 * Le client est construit une seule fois dans `src/prisma/db.ts` à partir du
 * contrat généré (`src/prisma/contract.json`) : on le réexporte ici plutôt que
 * d'appeler `postgres()` une seconde fois, ce qui dupliquerait le pool de
 * connexions et les empreintes du contrat.
 *
 * Le client est paresseux : aucune connexion n'est ouverte tant qu'une requête
 * n'est pas exécutée.
 *
 * @example
 * const user = await prisma.orm.public.User
 *   .where({ email: "alice@example.com" })
 *   .first();
 */
export const prisma: PostgresClient<Contract> = db;

/** Même client, sous le nom utilisé par la doc Prisma 8. */
export { prisma as db };

/** Type du client, pour typer les fonctions qui reçoivent la base. */
export type Prisma = typeof prisma;

/** Contrat compilant tous les modèles : `User`, `Company`, `Order`, ... */
export type PrismaContract = Contract;

/**
 * Ferme le pool de connexions. À appeler lors d'un arrêt propre du serveur,
 * typiquement dans un gestionnaire `SIGINT` / `SIGTERM`.
 */
export async function closePrisma(): Promise<void> {
  await prisma.close();
}

