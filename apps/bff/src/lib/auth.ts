import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import type { AppDb } from "../db";
import { seedNewUser } from "../services/seed-service";
import { nowIsoUtc } from "../lib/time";

export function createAuth(
  dbOrD1: D1Database | AppDb,
  baseURL?: string,
  trustedOrigins?: string[],
  secret?: string,
) {
  let db: AppDb;
  const shouldSeedOnUserCreate = "select" in dbOrD1;
  if (shouldSeedOnUserCreate) {
    db = dbOrD1 as AppDb;
  } else {
    db = drizzle(dbOrD1 as D1Database, { schema });
  }

  const resolvedSecret =
    secret ??
    (typeof process !== "undefined" && typeof process.env !== "undefined"
      ? process.env.BETTER_AUTH_SECRET
      : undefined);

  return betterAuth({
    baseURL: baseURL,
    trustedOrigins: trustedOrigins || [],
    secret: resolvedSecret,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
    },
    logger: {
      level: "error",
    },
    user: {
      additionalFields: {
        languagePreference: {
          type: "string",
          required: false,
          defaultValue: "en",
        },
        themeSettings: { type: "string", defaultValue: "auto" },
        displayCurrency: { type: "string", defaultValue: "CNY" },
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            if (!shouldSeedOnUserCreate) {
              return;
            }
            try {
              await seedNewUser(db, {
                userId: user.id,
                now: user.createdAt ? user.createdAt.toISOString() : nowIsoUtc(),
              });
            } catch (error) {
              console.error("Failed to seed new user:", error);
            }
          },
        },
      },
    },
  });
}
