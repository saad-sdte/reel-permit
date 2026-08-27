import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getStateConfig } from "@/lib/states";
import { dbConfigured, q } from "@/lib/db";
import {
  mongoConfigured,
  mongoGetByReference,
  mongoUpsertApp,
} from "@/lib/mongo";
import {
  getApplicationById,
  logPaymentEvent,
  markApplicationPaid,
  recordPayment,
  updateApplicationStatus,
} from "@/lib/storage";
import { opsAlert, sendRefundEmail, type LifecycleCtx } from "@/lib/email";

export const runtime = "nodejs";

/**
 * POST /api/webhooks/nmi — gateway webhook receiver (belt-and-braces with the
 * synchronous charge response).
 *
 * Register in the NMI merchant portal (Settings -> Webhooks) for at least:
 * transaction.sale.success, transaction.sale.failure,
 * transaction.refund.success, transaction.void.success — pointing at
 * http://localhost:3000/api/webhooks/nmi, then put the signing key NMI
 * shows you into NMI_WEBHOOK_SIGNING_KEY.
 *
 * Security: every delivery is verified with HMAC-SHA256 over
 * "{timestamp}.{raw body}" using the signing key (NMI's webhook-signature
 * header carries t=<unix>,s=<hex>). Stale timestamps (>5 min) and bad
 * signatures are rejected and logged — unverified payloads are NEVER
 * processed. Handlers are idempotent: event ids are deduped in
 * webhook_events, and payment/email writes ride existing unique keys.
 */

const MAX_SKEW_SECONDS = 5 * 60;

function parseSignatureHeader(header: string | null): { t: string; s: string } | null {
  if (!header) return null;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => kv.trim().split("=", 2) as [string, string]),
  );
  return parts.t && parts.s ? { t: parts.t, s: parts.s } : null;
}

function verifySignature(rawBody: string, header: string | null, key: string): boolean {
  const sig = parseSignatureHeader(header);
  if (!sig) return false;
  const ts = Number(sig.t);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > MAX_SKEW_SECONDS) return false;
  const expected = createHmac("sha256", key).update(`${sig.t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(sig.s.toLowerCase(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Pull a value out of NMI's (varied) payload shapes. */
function dig(obj: unknown, keys: string[]): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const record = obj as Record<string, unknown>;
  for (const k of keys) {
    const v = record[k];
    if (typeof v === "string" && v) return v;
    if (typeof v === "number") return String(v);
  }
  for (const v of Object.values(record)) {
    if (v && typeof v === "object") {
      const found = dig(v, keys);
      if (found) return found;
    }
  }
  return undefined;
}

export async function POST(request: Request) {
  const key = process.env.NMI_WEBHOOK_SIGNING_KEY?.trim();
  const rawBody = await request.text();

  if (!key) {
    // Not configured yet: acknowledge so NMI doesn't retry forever, but do
    // NOT process — and make the misconfiguration visible.
    // eslint-disable-next-line no-console
    console.warn("[webhooks/nmi] received a webhook but NMI_WEBHOOK_SIGNING_KEY is not set — ignored");
    return NextResponse.json({ ok: false, error: "signing key not configured" }, { status: 503 });
  }

  const header =
    request.headers.get("webhook-signature") ?? request.headers.get("x-nmi-signature");
  const valid = verifySignature(rawBody, header, key);

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    payload = { raw: rawBody.slice(0, 2000) };
  }

  const eventId = dig(payload, ["event_id", "id", "webhook_id"]);
  const eventType = dig(payload, ["event_type", "type"]) ?? "unknown";

  // Store EVERY delivery (verified or not) for auditability, deduped by id.
  if (dbConfigured()) {
    const inserted = await q<{ id: number }>(
      `insert into webhook_events (provider, event_id, event_type, signature_valid, payload)
       values ('nmi', $1, $2, $3, $4)
       on conflict (provider, event_id) where event_id is not null do nothing
       returning id`,
      [eventId ?? null, eventType, valid, payload],
    ).catch(() => ({ rows: [] as Array<{ id: number }>, rowCount: 0, command: "", oid: 0, fields: [] }));
    if (eventId && inserted.rows.length === 0) {
      // Replay of an already-stored event — acknowledge, do nothing.
      return NextResponse.json({ ok: true, duplicate: true });
    }
  }

  if (!valid) {
    // eslint-disable-next-line no-console
    console.warn(`[webhooks/nmi] INVALID signature for event ${eventId ?? "?"} (${eventType})`);
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }
  // Postgres OR Mongo — previously Mongo-only stacks returned early and never
  // reconciled missed sync approvals (exactly the $9-charged / no-admin-row bug).
  if (!dbConfigured() && !mongoConfigured()) {
    return NextResponse.json({ ok: true, processed: false });
  }

  const transactionId = dig(payload, ["transaction_id", "transactionid"]);
  const orderId = dig(payload, ["order_id", "orderid"]);
  let processed = false;
  let processError: string | undefined;

  try {
    if (/sale\.success|transaction\.sale\.success/i.test(eventType) && (transactionId || orderId)) {
      // Reconciliation: a charge our synchronous path missed (e.g. function
      // timeout after NMI approved). Find the application and mark it paid.
      let appId: string | null = null;

      if (dbConfigured()) {
        const row = transactionId
          ? await q<{ application_id: string }>(
              `select application_id from payments where transaction_id = $1 limit 1`,
              [transactionId],
            )
          : { rows: [] as Array<{ application_id: string }> };
        appId = row.rows[0]?.application_id ?? null;
        if (!appId && orderId) {
          const byRef = await q<{ id: string; status: string }>(
            `select id, status from applications where reference = $1 limit 1`,
            [orderId],
          );
          const app = byRef.rows[0];
          if (app && ["pending_payment", "payment_failed"].includes(app.status)) {
            appId = app.id;
            const amountStr = dig(payload, ["amount"]);
            await recordPayment({
              applicationId: app.id,
              kind: "sale",
              source: "webhook",
              transactionId,
              amountCents: amountStr ? Math.round(Number(amountStr) * 100) : 0,
              status: "approved",
              idempotencyKey: transactionId ? `webhook-sale/${transactionId}` : undefined,
            });
            await markApplicationPaid(app.id);
            await opsAlert(
              `Webhook reconciled a missed payment — ${orderId}`,
              `NMI reported an approved sale (txn ${transactionId ?? "?"}) that the synchronous path hadn't recorded. Application marked paid — confirm emails went out.`,
            );
          }
        }
      } else if (mongoConfigured() && orderId) {
        const app = await mongoGetByReference(orderId);
        if (app && ["pending_payment", "payment_failed"].includes(app.status)) {
          appId = app.id;
          const paidAt = new Date().toISOString();
          await markApplicationPaid(app.id);
          await mongoUpsertApp(
            { ...app, status: "received", paidAt, statusReason: null },
            { transactionId: transactionId },
          );
          await opsAlert(
            `Webhook reconciled a missed payment (Mongo) — ${orderId}`,
            `NMI reported an approved sale (txn ${transactionId ?? "?"}) that the synchronous path hadn't recorded. Application marked paid in Mongo.`,
          );
        }
      }

      if (appId && dbConfigured()) {
        await logPaymentEvent({
          applicationId: appId,
          source: "webhook",
          eventType: "webhook_sale_success",
          detail: { transactionId, eventId },
        });
      }
      processed = true;
    } else if (
      dbConfigured() &&
      /refund\.success|void\.success/i.test(eventType) &&
      transactionId
    ) {
      // Refund issued (from the NMI portal or elsewhere) — reflect it and
      // send #10 (idempotent; a same-day admin-panel refund won't double-send).
      const orig = await q<{ application_id: string; amount_cents: number; card_brand: string | null; card_last4: string | null }>(
        `select application_id, amount_cents, card_brand, card_last4 from payments
          where transaction_id = $1 and status = 'approved' limit 1`,
        [transactionId],
      );
      const original = orig.rows[0];
      if (original) {
        const refundTxn = dig(payload, ["refund_transaction_id"]) ?? `${transactionId}-refund`;
        await recordPayment({
          applicationId: original.application_id,
          kind: "refund",
          source: "webhook",
          transactionId: refundTxn,
          amountCents: original.amount_cents,
          status: "refunded",
          idempotencyKey: `refund/${transactionId}`,
        });
        await updateApplicationStatus(original.application_id, "refunded", "gateway refund webhook");
        const app = await getApplicationById(original.application_id);
        if (app?.email) {
          const config = await getStateConfig(app.stateSlug);
          const ctx: LifecycleCtx = {
            config,
            applicationId: app.id,
            reference: app.reference,
            stateSlug: app.stateSlug,
            firstName: app.firstName,
            fullName: [app.firstName, app.lastName].filter(Boolean).join(" ") || null,
            email: app.email,
            residency: app.residency,
            licenseId: app.licenseId,
            addOnIds: app.addOnIds,
            amount: app.amountCents / 100,
            maskedData: app.formData,
          };
          await sendRefundEmail(ctx, {
            refundTransactionId: refundTxn,
            refundedAt: new Date(),
            cardBrand: original.card_brand,
            cardLast4: original.card_last4,
            amount: original.amount_cents / 100,
          });
        }
        await logPaymentEvent({
          applicationId: original.application_id,
          source: "webhook",
          eventType: "webhook_refund_success",
          detail: { transactionId, refundTxn, eventId },
        });
      }
      processed = true;
    } else if (dbConfigured() && /sale\.failure/i.test(eventType)) {
      // The synchronous decline path already handles customer comms; just audit.
      if (transactionId) {
        const row = await q<{ application_id: string }>(
          `select application_id from payments where transaction_id = $1 limit 1`,
          [transactionId],
        );
        if (row.rows[0]) {
          await logPaymentEvent({
            applicationId: row.rows[0].application_id,
            source: "webhook",
            eventType: "webhook_sale_failure",
            detail: { transactionId, eventId },
          });
        }
      }
      processed = true;
    }
  } catch (err) {
    processError = err instanceof Error ? err.message : "unknown";
    // eslint-disable-next-line no-console
    console.error(`[webhooks/nmi] processing error for ${eventId ?? "?"}: ${processError}`);
  }

  if (dbConfigured() && eventId) {
    await q(
      `update webhook_events set processed = $2, process_error = $3
        where provider = 'nmi' and event_id = $1`,
      [eventId, processed, processError ?? null],
    ).catch(() => {});
  }

  return NextResponse.json({ ok: true, processed });
}
