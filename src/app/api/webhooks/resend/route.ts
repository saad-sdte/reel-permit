import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { dbConfigured, q } from "@/lib/db";
import { opsAlert } from "@/lib/email";

export const runtime = "nodejs";

/**
 * POST /api/webhooks/resend — delivery-status webhook (Svix-signed).
 *
 * Set up in the Resend dashboard (Webhooks -> Add endpoint) pointing at
 * http://localhost:3000/api/webhooks/resend with events email.delivered,
 * email.bounced, email.complained — then put the endpoint's signing secret
 * (whsec_...) into RESEND_WEBHOOK_SECRET.
 *
 * On each event the matching email_log row (by provider_message_id) gets its
 * status updated. A HARD BOUNCE on a license-delivery email raises an URGENT
 * ops alert — a customer who never receives their license is the worst
 * failure mode this business has.
 */

const MAX_SKEW_SECONDS = 5 * 60;

function verifySvix(rawBody: string, headers: Headers, secret: string): boolean {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatures = headers.get("svix-signature");
  if (!id || !timestamp || !signatures) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > MAX_SKEW_SECONDS) return false;

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", secretBytes).update(signedContent).digest("base64");
  const expectedBuf = Buffer.from(expected, "utf8");

  // Header holds space-separated "v1,<base64sig>" entries.
  for (const part of signatures.split(" ")) {
    const sig = part.includes(",") ? part.split(",", 2)[1] : part;
    const sigBuf = Buffer.from(sig, "utf8");
    if (sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf)) return true;
  }
  return false;
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  const rawBody = await request.text();

  if (!secret) {
    // eslint-disable-next-line no-console
    console.warn("[webhooks/resend] received a webhook but RESEND_WEBHOOK_SECRET is not set — ignored");
    return NextResponse.json({ ok: false, error: "signing secret not configured" }, { status: 503 });
  }
  if (!verifySvix(rawBody, request.headers, secret)) {
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  let payload: { type?: string; data?: { email_id?: string; to?: string[] | string; subject?: string } };
  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 });
  }

  const type = payload.type ?? "";
  const messageId = payload.data?.email_id;
  if (!messageId || !dbConfigured()) return NextResponse.json({ ok: true, processed: false });

  const statusMap: Record<string, string> = {
    "email.delivered": "sent",
    "email.bounced": "failed",
    "email.complained": "failed",
  };
  const newStatus = statusMap[type];
  if (!newStatus) return NextResponse.json({ ok: true, processed: false });

  const updated = await q<{ id: number; email_type: string; application_id: string | null; recipient: string }>(
    `update email_log
        set status = $2,
            error = case when $2 = 'failed' then $3 else error end
      where provider_message_id = $1
      returning id, email_type, application_id, recipient`,
    [messageId, newStatus, type],
  ).catch(() => ({ rows: [] as Array<{ id: number; email_type: string; application_id: string | null; recipient: string }> }));

  const row = updated.rows[0];
  if (row && (type === "email.bounced" || type === "email.complained")) {
    const urgent = row.email_type === "license_delivered";
    await opsAlert(
      `${urgent ? "URGENT: license email bounced" : `Email ${type.split(".")[1]}`} — ${row.recipient}`,
      [
        `Type: ${row.email_type}`,
        `Application: ${row.application_id ?? "—"}`,
        `Recipient: ${row.recipient}`,
        `Event: ${type} (Resend message ${messageId})`,
        "",
        urgent
          ? "The customer has NOT received their license. Contact them another way (phone) or re-send to a corrected address from the admin panel."
          : "Check the address; correct and resend from the admin panel if needed.",
      ].join("\n"),
    );
  }

  return NextResponse.json({ ok: true, processed: Boolean(row) });
}
