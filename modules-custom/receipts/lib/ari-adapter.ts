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
// ARI injects x-ari-user-id on every proxied request; same-origin shell may
// set an ari_session cookie instead.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getUserId(req: Request): Promise<string> {
  const r = req as import("next/server").NextRequest;

  // ARI host injects x-ari-user-id on every internal request
  const fromHeader = r.headers.get("x-ari-user-id");
  if (fromHeader && UUID_RE.test(fromHeader)) {
    return fromHeader;
  }

  // Same-origin ARI shell may set ari_session cookie
  const fromCookie = r.cookies?.get?.("ari_session")?.value;
  if (fromCookie && UUID_RE.test(fromCookie)) {
    return fromCookie;
  }

  // Dev fallback — only active when DATABASE_URL and NODE_ENV suggest local dev
  if (process.env.NODE_ENV !== "production") {
    return "00000000-0000-0000-0000-000000000001";
  }

  throw new Error("Unauthorized: no ARI session");
}
