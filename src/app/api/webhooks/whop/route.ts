import { NextResponse } from "next/server";
import { unwrapWebhook } from "@whop/sdk/helpers";
import { getApplicationById, getApplicationByReference } from "@/lib/storage";
import { fulfillPaidApplication } from "@/lib/complete-paid-order";

export const runtime = "nodejs";

interface WhopPaymentEvent {
  type?: string;
  data?: {
    id?: string;
    status?: string;
    card_last4?: string | null;
    card_brand?: string | null;
    metadata?: Record<string, unknown> | null;
    amount?: number;
    usd_total?: number | null;
  };
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.WHOP_WEBHOOK_SECRET?.trim();
  const payload = await request.text();
  const headers = Object.fromEntries(request.headers);

  let event: WhopPaymentEvent;
  try {
    event = unwrapWebhook<WhopPaymentEvent>(payload, { headers, key: secret });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (event.type !== "payment.succeeded") {
    return NextResponse.json({ ok: true, ignored: event.type ?? "unknown" });
  }

  const data = event.data ?? {};
  const meta = data.metadata ?? {};
  const applicationId = typeof meta.application_id === "string" ? meta.application_id : "";
  const reference = typeof meta.reference === "string" ? meta.reference : "";
  const txn = data.id ?? `whop_${Date.now()}`;

  const app = applicationId
    ? await getApplicationById(applicationId)
    : reference
      ? await getApplicationByReference(reference)
      : null;

  if (!app) {
    return NextResponse.json({ ok: true, unmatched: true });
  }

  const amountUsd =
    typeof data.usd_total === "number"
      ? data.usd_total
      : typeof data.amount === "number"
        ? data.amount
        : app.amountCents / 100;

  await fulfillPaidApplication({
    app,
    transactionId: txn,
    amountUsd,
    last4: data.card_last4 ?? undefined,
    brand: data.card_brand ?? undefined,
    source: "webhook",
    rawResponse: event,
  });

  return NextResponse.json({ ok: true });
}
