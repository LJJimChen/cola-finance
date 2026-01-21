import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import type { D1Database } from "@cloudflare/workers-types";
import type { AppDb } from "../db";
import { seedNewUser } from "../services/seed-service";
import { nowIsoUtc } from "../lib/time";

export function createAuth(dbOrD1: D1Database | AppDb, baseURL?: string, trustedOrigins?: string[]) {
  let db: AppDb;
  // Check if it's Drizzle instance (has 'select', 'insert', etc.)
  if ('select' in dbOrD1) {
    db = dbOrD1 as AppDb;
  } else {
    db = drizzle(dbOrD1 as D1Database, { schema });
  }

  return betterAuth({
    baseURL: baseURL || "http://localhost:3000",
    trustedOrigins: trustedOrigins || [],
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      }
    }),
    emailAndPassword: {
      enabled: true,
    },
    logger: {
        level: "debug",
    },
    user: {
      additionalFields: {
        languagePreference: { type: "string", required: false, defaultValue: "en" },
        themeSettings: { type: "string", defaultValue: "auto" },
        displayCurrency: { type: "string", defaultValue: "CNY" },
        timeZone: { type: "string", defaultValue: "Asia/Shanghai" },
      }
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            try {
              await seedNewUser(db, {
                userId: user.id,
                now: user.createdAt ? user.createdAt.toISOString() : nowIsoUtc(),
              });
            } catch (error) {
              console.error("Failed to seed new user:", error);
            }
          }
        }
      }
    }
  });
}
