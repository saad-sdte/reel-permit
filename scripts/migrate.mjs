#!/usr/bin/env node
/**
 * Tiny, dependency-light migration runner.
 *
 *   DATABASE_URL=postgres://... node scripts/migrate.mjs         # apply pending
 *   DATABASE_URL=postgres://... node scripts/migrate.mjs status  # show state
 *
 * - Applies migrations/*.sql in filename order.
 * - Each file runs inside a transaction and is recorded in schema_migrations,
 *   so re-running is always safe (applied files are skipped).
 * - Advisory lock prevents two deploys from migrating concurrently.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "..", "migrations");

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  // Exit 0 so `npm run build` (which runs migrations first) still succeeds in
  // environments without a database — preview deploys, local zero-env dev.
  console.warn("migrate: DATABASE_URL is not set — skipping migrations.");
  process.exit(0);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

const LOCK_KEY = 727411; // arbitrary app-wide advisory lock id
try {
  await client.query("select pg_advisory_lock($1)", [LOCK_KEY]);
  await client.query(`
    create table if not exists schema_migrations (
      id         text primary key,
      applied_at timestamptz not null default now()
    )`);

  const applied = new Set(
    (await client.query("select id from schema_migrations")).rows.map((r) => r.id),
  );
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (process.argv[2] === "status") {
    for (const f of files) console.log(`${applied.has(f) ? "applied" : "pending"}  ${f}`);
    process.exit(0);
  }

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    process.stdout.write(`migrate: applying ${file} ... `);
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into schema_migrations (id) values ($1)", [file]);
      await client.query("commit");
      console.log("ok");
      ran++;
    } catch (err) {
      await client.query("rollback");
      console.error(`FAILED\n${err.message}`);
      process.exit(1);
    }
  }
  console.log(ran === 0 ? "migrate: nothing to apply — up to date." : `migrate: ${ran} migration(s) applied.`);
} finally {
  await client.query("select pg_advisory_unlock($1)", [LOCK_KEY]).catch(() => {});
  await client.end();
}
