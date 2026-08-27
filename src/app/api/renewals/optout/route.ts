import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { dbConfigured, q } from "@/lib/db";
import { SUPPORT_EMAIL } from "@/lib/contact";

export const runtime = "nodejs";

/**
 * /api/renewals/optout?ref=AP-...&sig=... — stop license-renewal reminders.
 *
 * The link is HMAC-signed with CRON_SECRET (no token table needed): only the
 * server can mint a valid sig for a reference. GET renders a tiny
 * confirmation page; POST (incl. RFC 8058 one-click) performs the opt-out.
 */

function expectedSig(reference: string): string | null {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return null;
  return createHmac("sha256", secret).update(`renewal-optout/${reference}`).digest("hex").slice(0, 32);
}

function sigOk(reference: string, sig: string): boolean {
  const expected = expectedSig(reference);
  if (!expected || sig.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

async function optOut(reference: string): Promise<boolean> {
  if (!dbConfigured()) return false;
  const res = await q(
    `update applications set renewal_opt_out_at = coalesce(renewal_opt_out_at, now())
      where reference = $1`,
    [reference],
  );
  return (res.rowCount ?? 0) > 0;
}

function page(body: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Renewal reminders — ReelPermit</title></head>
<body style="margin:0;background:#F4F6F8;font-family:system-ui,-apple-system,'Segoe UI',Arial,sans-serif;">
<div style="max-width:520px;margin:60px auto;padding:0 16px;">
  <div style="background:#16332b;border-radius:14px 14px 0 0;padding:22px 30px;color:#fff;font-size:19px;font-weight:600;">Reel<span style="color:#e2c48a;">Permit</span></div>
  <div style="background:#fff;border:1px solid #E3E8EF;border-top:0;border-radius:0 0 14px 14px;padding:30px;text-align:center;">${body}</div>
</div></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ref = url.searchParams.get("ref") ?? "";
  const sig = url.searchParams.get("sig") ?? "";
  if (!ref || !sigOk(ref, sig)) {
    return page(`<h1 style="font-size:20px;color:#0A2540;">This link isn't valid</h1>
      <p style="color:#475569;line-height:1.6;">If you're still receiving emails you don't want, write to ${SUPPORT_EMAIL} and we'll take care of it.</p>`);
  }
  return page(`<h1 style="font-size:20px;color:#0A2540;">Stop renewal reminders?</h1>
    <p style="color:#475569;line-height:1.6;">We'll stop sending license-renewal reminders for <strong style="font-family:monospace;">${ref.replace(/[^A-Za-z0-9-]/g, "")}</strong>. Receipts and essential emails are unaffected.</p>
    <form method="POST" action="/api/renewals/optout?ref=${encodeURIComponent(ref)}&sig=${encodeURIComponent(sig)}">
      <button type="submit" style="background:#0A2540;color:#fff;border:0;border-radius:8px;padding:13px 30px;font-size:15px;font-weight:600;cursor:pointer;">Stop renewal reminders</button>
    </form>`);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const ref = url.searchParams.get("ref") ?? "";
  const sig = url.searchParams.get("sig") ?? "";
  if (!ref || !sigOk(ref, sig)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  await optOut(ref);
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/html")) {
    return page(`<h1 style="font-size:20px;color:#067647;">Done — reminders stopped</h1>
      <p style="color:#475569;line-height:1.6;">You won't receive renewal reminders for this license. The Michigan desk will stay quiet on this file.</p>`);
  }
  return NextResponse.json({ ok: true });
}
