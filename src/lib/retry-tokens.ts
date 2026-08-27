import { createHash, randomBytes } from "node:crypto";
import { dbConfigured, q } from "@/lib/db";

/**
 * Secure payment-retry tokens for /pay/{token} (no-login recovery links).
 *
 * - Token: 32 random bytes, base64url — sent ONLY inside the email link.
 * - Storage: sha256 hex of the token. The raw value is never persisted, so a
 *   database leak cannot mint working payment links.
 * - Single-active policy: issuing a new token supersedes all prior active
 *   tokens for the application.
 * - Expiry: decline + 8 days (Day-8 auto-cancel makes the link pointless
 *   afterwards; the /pay page shows a friendly expired state).
 */

export const RETRY_TOKEN_TTL_DAYS = 8;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface IssuedRetryToken {
  token: string;
  url: string;
  expiresAt: Date;
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * Issue a fresh retry token for an application (supersedes older ones).
 * Returns null when no database is configured (dev mode).
 */
export async function issueRetryToken(
  applicationId: string,
  opts?: { anchor?: Date },
): Promise<IssuedRetryToken | null> {
  if (!dbConfigured()) return null;

  const token = randomBytes(32).toString("base64url");
  const anchor = opts?.anchor ?? new Date();
  const expiresAt = new Date(anchor.getTime() + RETRY_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await q(
    `update retry_tokens set superseded_at = now()
      where application_id = $1 and used_at is null and superseded_at is null`,
    [applicationId],
  );
  await q(
    `insert into retry_tokens (application_id, token_hash, expires_at) values ($1,$2,$3)`,
    [applicationId, hashToken(token), expiresAt],
  );

  return { token, url: `${siteUrl()}/pay/${token}`, expiresAt };
}

/** Get the newest ACTIVE token's expiry for an application (or null). */
export async function activeTokenExpiry(applicationId: string): Promise<Date | null> {
  if (!dbConfigured()) return null;
  const res = await q<{ expires_at: Date }>(
    `select expires_at from retry_tokens
      where application_id = $1 and used_at is null and superseded_at is null
        and expires_at > now()
      order by created_at desc limit 1`,
    [applicationId],
  );
  return res.rows[0]?.expires_at ?? null;
}

export type RetryTokenCheck =
  | { status: "valid"; applicationId: string; tokenId: string }
  | { status: "expired"; applicationId: string }
  | { status: "used"; applicationId: string }
  | { status: "invalid" };

/** Validate a raw token from a /pay/{token} URL. */
export async function checkRetryToken(token: string): Promise<RetryTokenCheck> {
  if (!dbConfigured() || !token || token.length < 20) return { status: "invalid" };
  const res = await q<{
    id: string;
    application_id: string;
    expires_at: Date;
    used_at: Date | null;
    superseded_at: Date | null;
  }>(
    `select id, application_id, expires_at, used_at, superseded_at
       from retry_tokens where token_hash = $1`,
    [hashToken(token)],
  );
  const row = res.rows[0];
  if (!row) return { status: "invalid" };
  if (row.used_at) return { status: "used", applicationId: row.application_id };
  // A superseded link should keep working conceptually — but single-active is
  // the spec, so treat it as expired (the newest email has the live link).
  if (row.superseded_at) return { status: "expired", applicationId: row.application_id };
  if (row.expires_at.getTime() < Date.now()) return { status: "expired", applicationId: row.application_id };
  return { status: "valid", applicationId: row.application_id, tokenId: row.id };
}

/** Mark a token used after a successful retry payment. */
export async function consumeRetryToken(tokenId: string): Promise<void> {
  if (!dbConfigured()) return;
  await q(`update retry_tokens set used_at = now() where id = $1 and used_at is null`, [tokenId]);
}
