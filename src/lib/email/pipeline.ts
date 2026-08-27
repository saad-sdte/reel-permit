import { Resend } from "resend";
import { dbConfigured, q } from "@/lib/db";
import { BUSINESS } from "./email-layout";

/**
 * sendEmail() — the single pipeline EVERY lifecycle email goes through.
 *
 * Exactly-once guarantee (belt and braces):
 *  1. email_log reserve-then-send: an INSERT ... ON CONFLICT DO NOTHING on the
 *     partial unique index (application_id, email_type, sequence_step) means
 *     only ONE caller ever wins the right to send a given logical email —
 *     webhook replays, cron re-runs and double-fired events lose the race and
 *     skip. Failed attempts can be reclaimed; stale "sending" reservations
 *     (crashed function) are reclaimed after 15 minutes.
 *  2. Resend idempotency key `${type}/${applicationId}/${step}` de-dupes at
 *     the provider for 24h even if the DB is unavailable.
 *
 * Failure containment: a failed email NEVER throws into the calling flow —
 * payment processing must not break because an email bounced. Failures are
 * recorded in email_log and surfaced via an [AP Ops] alert.
 *
 * PII: email_log stores metadata only (type/recipient/subject/message id and
 * a small `meta` props reference) — never full rendered bodies.
 */

const RESEND_RETRIES = 3;
const RETRY_DELAYS_MS = [500, 1500];

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

function getResend(): Resend | null {
  const key = env("RESEND_API_KEY");
  return key ? new Resend(key) : null;
}

export interface DeliverArgs {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string | string[];
  tag: string;
  idempotencyKey?: string;
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>;
}

export interface DeliverResult {
  delivered: boolean;
  id?: string;
  error?: string;
}

/**
 * Low-level Resend send with dev fallback, bounded retries with backoff,
 * and error containment. Never throws.
 */
export async function deliver(args: DeliverArgs): Promise<DeliverResult> {
  // TEST HOOK (never honored on Vercel): pretend the provider accepted the
  // email so idempotency/sequencing can be exercised without an API key.
  if (process.env.EMAIL_FAKE_DELIVER === "true" && !process.env.VERCEL) {
    // eslint-disable-next-line no-console
    console.log(`[email:fake] "${args.subject}" -> ${Array.isArray(args.to) ? args.to.join(",") : args.to}`);
    return { delivered: true, id: `fake-${Math.random().toString(36).slice(2, 10)}` };
  }

  const resend = getResend();

  if (!resend) {
    // Dev-mode fallback: no provider configured — log instead of sending.
    // eslint-disable-next-line no-console
    console.log(
      `[email:dev] RESEND_API_KEY not set — would send "${args.subject}" to ${
        Array.isArray(args.to) ? args.to.join(", ") : args.to
      }\n${args.text.slice(0, 500)}`,
    );
    return { delivered: false, error: "RESEND_API_KEY not configured" };
  }

  let lastError = "unknown error";
  for (let attempt = 0; attempt < RESEND_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt - 1] ?? 2000));
    }
    try {
      const { data, error } = await resend.emails.send(
        {
          from: args.from,
          to: args.to,
          subject: args.subject,
          html: args.html,
          text: args.text,
          ...(args.replyTo ? { replyTo: args.replyTo } : {}),
          ...(args.attachments ? { attachments: args.attachments } : {}),
          ...(args.headers ? { headers: args.headers } : {}),
          tags: [{ name: "category", value: args.tag }, ...(args.tags ?? [])],
        },
        args.idempotencyKey ? { idempotencyKey: args.idempotencyKey } : undefined,
      );
      if (!error) return { delivered: true, id: data?.id };

      lastError = error.message;
      // Retry only transient provider problems; validation errors won't heal.
      const transient = /rate.?limit|timeout|network|temporar|5\d\d|internal/i.test(
        `${error.name ?? ""} ${error.message}`,
      );
      // eslint-disable-next-line no-console
      console.error(`[email] Resend error (${args.tag}, attempt ${attempt + 1}): ${error.message}`);
      if (!transient) break;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "unknown error";
      // eslint-disable-next-line no-console
      console.error(`[email] send failed (${args.tag}, attempt ${attempt + 1}): ${lastError}`);
    }
  }
  return { delivered: false, error: lastError };
}

/* ------------------------------------------------------------------ */
/* the idempotent pipeline                                             */
/* ------------------------------------------------------------------ */

export interface SendEmailArgs {
  /** Application this email belongs to (drives idempotency). */
  applicationId?: string | null;
  /** Logical email type, e.g. "application_received", "payment_declined". */
  type: string;
  /** Dunning step (2/4/7) or 0. Part of the idempotency key. */
  sequenceStep?: number;
  to: string | string[];
  from: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string | string[];
  headers?: Record<string, string>;
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>;
  /** Small metadata stored in email_log (NEVER PII-heavy props). */
  meta?: Record<string, unknown>;
  /** Manual admin resend: bypasses dedupe by allocating a resend slot. */
  force?: boolean;
}

export type SendEmailResult =
  | { status: "sent"; id?: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

interface LogRow {
  id: string;
}

/** Reserve the (application, type, step) slot. Returns log row id or null if lost. */
async function reserveSlot(
  applicationId: string,
  type: string,
  step: number,
  recipient: string,
  subject: string,
  meta: Record<string, unknown> | undefined,
): Promise<string | null> {
  const inserted = await q<LogRow>(
    `insert into email_log (application_id, email_type, sequence_step, recipient, subject, status, meta)
     values ($1,$2,$3,$4,$5,'sending',$6)
     on conflict (application_id, email_type, sequence_step)
       where status in ('sending','sent') and application_id is not null
       do nothing
     returning id`,
    [applicationId, type, step, recipient, subject, meta ?? null],
  );
  if (inserted.rows[0]) return inserted.rows[0].id;

  // A prior FAILED attempt can be reclaimed; so can a stale "sending"
  // reservation from a crashed invocation (>15 min old).
  const reclaimed = await q<LogRow>(
    `update email_log
        set status = 'sending', recipient = $4, subject = $5, error = null
      where application_id = $1 and email_type = $2 and sequence_step = $3
        and (status = 'failed' or (status = 'sending' and updated_at < now() - interval '15 minutes'))
      returning id`,
    [applicationId, type, step, recipient, subject],
  );
  return reclaimed.rows[0]?.id ?? null;
}

/**
 * Send a lifecycle email exactly once per (application, type, step).
 * Never throws.
 */
export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const step = args.sequenceStep ?? 0;
  const recipient = Array.isArray(args.to) ? args.to.join(", ") : args.to;
  const appId = args.applicationId ?? null;

  let logId: string | null = null;
  let effectiveStep = step;

  if (appId && dbConfigured()) {
    try {
      if (args.force) {
        // Manual resend: allocate the next free resend slot (step >= 100).
        const res = await q<{ next: number }>(
          `select coalesce(max(sequence_step) + 1, 100) as next
             from email_log
            where application_id = $1 and email_type = $2 and sequence_step >= 100`,
          [appId, args.type],
        );
        effectiveStep = Math.max(res.rows[0]?.next ?? 100, 100);
      }
      logId = await reserveSlot(
        appId,
        args.type,
        effectiveStep,
        recipient,
        args.subject,
        args.meta,
      );
      if (!logId) {
        return { status: "skipped", reason: "already sent or sending" };
      }
    } catch (err) {
      // DB trouble must not block the email — fall through to provider-level
      // idempotency, which still prevents duplicates for 24h.
      // eslint-disable-next-line no-console
      console.error(
        `[email] email_log reservation failed for ${args.type}/${appId}: ${err instanceof Error ? err.message : "unknown"}`,
      );
    }
  }

  const result = await deliver({
    from: args.from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
    replyTo: args.replyTo,
    tag: args.type,
    idempotencyKey: appId ? `${args.type}/${appId}/${effectiveStep}` : undefined,
    headers: args.headers,
    attachments: args.attachments,
    tags: [
      ...(appId ? [{ name: "application_id", value: appId.replace(/[^a-zA-Z0-9_-]/g, "") }] : []),
      { name: "sequence_step", value: String(effectiveStep) },
    ],
  });

  if (logId) {
    try {
      // Dev mode (no provider) records "skipped", which releases the
      // exactly-once slot so a later real send can claim it.
      const status = result.delivered
        ? "sent"
        : result.error === "RESEND_API_KEY not configured"
          ? "skipped"
          : "failed";
      await q(
        `update email_log set status = $2, provider_message_id = $3, error = $4 where id = $1`,
        [logId, status, result.id ?? null, result.delivered ? null : (result.error ?? "unknown")],
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        `[email] email_log update failed for ${logId}: ${err instanceof Error ? err.message : "unknown"}`,
      );
    }
  }

  if (result.delivered) return { status: "sent", id: result.id };

  // Dev mode without a provider counts as "skipped", not an ops incident.
  if (result.error === "RESEND_API_KEY not configured") {
    return { status: "skipped", reason: result.error };
  }

  // Real failure: alert ops (direct deliver — never recurse into sendEmail).
  await opsAlert(
    `Email send FAILED: ${args.type} for ${appId ?? "(no app)"}`,
    [
      `Type: ${args.type} (step ${effectiveStep})`,
      `Application: ${appId ?? "—"}`,
      `Recipient: ${recipient}`,
      `Error: ${result.error ?? "unknown"}`,
      "",
      "The send was retried 3 times and recorded as failed in email_log.",
      "Resend from the admin panel once the cause is fixed.",
    ].join("\n"),
  );
  return { status: "failed", error: result.error ?? "unknown" };
}

/* ------------------------------------------------------------------ */
/* internal ops alerts                                                 */
/* ------------------------------------------------------------------ */

export function adminRecipients(): string[] {
  return (env("ADMIN_EMAIL") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Plain, fast, information-dense internal email with the [AP Ops] prefix.
 * Best effort — never throws, never recurses into sendEmail.
 */
export async function opsAlert(subject: string, body: string): Promise<void> {
  const admins = adminRecipients();
  if (!admins.length) {
    // eslint-disable-next-line no-console
    console.warn(`[ops-alert] ADMIN_EMAIL not set — "${subject}" logged only:\n${body}`);
    return;
  }
  await deliver({
    from: env("EMAIL_FROM") ?? "ReelPermit <orders@reelpermit.local>",
    to: admins,
    subject: `[AP Ops] ${subject}`,
    html: `<pre style="font-family:ui-monospace,Consolas,Menlo,monospace;font-size:13px;line-height:1.6;white-space:pre-wrap;">${body
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")}</pre>`,
    text: body,
    replyTo: BUSINESS.supportEmail,
    tag: "ops-alert",
  });
}
