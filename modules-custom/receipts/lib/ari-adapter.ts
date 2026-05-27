// PHASE 0: the ONLY file that imports ARI / infrastructure internals.
// All other module code imports from here — never scatter infra imports elsewhere.
import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@receipts/database/schema";

// Global singleton — avoids exhausting the connection pool across hot-reloads
// in Next.js dev mode and across serverless invocations in production.
declare global {
  // eslint-disable-next-line no-var
  var __receiptsDb: PostgresJsDatabase<typeof schema> | undefined;
}

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!global.__receiptsDb) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Copy .env.example → .env.local and fill it in."
      );
    }
    const client = postgres(url, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    global.__receiptsDb = drizzle(client, { schema });
  }
  return global.__receiptsDb;
}

// ---- CURRENT USER ----
// Replace this body with the real auth/session resolution once ARI is wired.
// DEMO FALLBACK: a fixed user UUID so the whole demo works without auth.
// If RLS blocks inserts with this uid, run:
//   ALTER TABLE receipts_sources DISABLE ROW LEVEL SECURITY;
//   ALTER TABLE receipts_ledger  DISABLE ROW LEVEL SECURITY;
export async function getUserId(_req: Request): Promise<string> {
  return "00000000-0000-0000-0000-000000000001";
}
