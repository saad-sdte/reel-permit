import { NextResponse } from "next/server";
import { checkRetryToken } from "@/lib/retry-tokens";
import { logPaymentEvent, pauseDunning } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * POST /api/dunning/pause — one-click "pause payment reminders".
 *
 * Serves two callers:
 *  - RFC 8058 one-click List-Unsubscribe: mail clients POST here directly
 *    (?token=...&one_click=1) with no body and expect a 2xx.
 *  - The /reminders/pause/{token} confirmation page's form.
 *
 * The retry token identifies the application (no login). An EXPIRED token is
 * still accepted for pausing — stopping mail must always work — but a token
 * that doesn't exist is rejected. Pausing stops reminders #5–#7 only; the
 * already-communicated Day-8 auto-cancel still happens.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  let token = url.searchParams.get("token") ?? "";
  if (!token) {
    // Form posts may carry it in the body instead.
    try {
      const form = await request.formData();
      token = String(form.get("token") ?? "");
    } catch {
      /* no body */
    }
  }

  const check = await checkRetryToken(token);
  if (check.status === "invalid") {
    return NextResponse.json({ ok: false, message: "Unknown link." }, { status: 404 });
  }
  if (check.status === "used") {
    // Application already paid — nothing to pause; treat as success.
    return NextResponse.json({ ok: true, alreadyResolved: true });
  }

  const paused = await pauseDunning(check.applicationId);
  if (paused) {
    await logPaymentEvent({
      applicationId: check.applicationId,
      source: "system",
      eventType: "dunning_paused",
      detail: { via: url.searchParams.get("one_click") ? "one_click" : "page" },
    });
  }

  // Form flow: bounce back to the confirmation page.
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/html")) {
    return NextResponse.redirect(new URL(`/reminders/pause/${token}?done=1`, url.origin), 303);
  }
  return NextResponse.json({ ok: true });
}
