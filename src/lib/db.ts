import { Pool, type QueryResult, type QueryResultRow } from "pg";

/**
 * Postgres access — single shared pool per serverless instance.
 *
 * - DATABASE_URL unset  -> getDb() returns null and every feature that needs
 *   persistence falls back to dev-mode behavior (console logging). The site
 *   keeps working with zero env, matching the rest of the codebase.
 * - DATABASE_URL set    -> small pool (serverless-friendly). Use a POOLED
 *   connection string in production (Neon "-pooler" host / Supabase pgbouncer).
 * - SSL comes from the URL itself (`?sslmode=require`), which hosted Postgres
 *   providers include by default. Local dev URLs work without it.
 *
 * The pool is cached on globalThis so Next.js dev-server hot reloads and
 * repeated lambda invocations reuse connections instead of leaking them.
 */

declare global {
  // eslint-disable-next-line no-var
  var __anglerpermitPgPool: Pool | null | undefined;
}

export function getDb(): Pool | null {
  if (globalThis.__anglerpermitPgPool !== undefined) return globalThis.__anglerpermitPgPool;

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    globalThis.__anglerpermitPgPool = null;
    return null;
  }

  const pool = new Pool({
    connectionString: url,
    max: 3,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  pool.on("error", (err) => {
    // Never crash the process on an idle-client error (network blips).
    // eslint-disable-next-line no-console
    console.error(`[db] idle client error: ${err.message}`);
  });

  globalThis.__anglerpermitPgPool = pool;
  return pool;
}

/** True when a real database is configured. */
export function dbConfigured(): boolean {
  return getDb() !== null;
}

/**
 * Run a query against the shared pool.
 * Throws if no database is configured — call dbConfigured() first on paths
 * that must degrade gracefully.
 */
export async function q<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is not configured");
  return db.query<T>(text, params);
}
