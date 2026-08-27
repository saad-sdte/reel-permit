import { NextResponse } from "next/server";
import { getApplicationById } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const applicationId = url.searchParams.get("applicationId")?.trim();
  if (!applicationId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const app = await getApplicationById(applicationId);
  if (!app) {
    return NextResponse.json({ ok: false, paid: false }, { status: 404 });
  }
  const paid = app.status === "received" || app.status === "processing" || app.status === "delivered";
  return NextResponse.json({
    ok: true,
    paid,
    reference: app.reference,
    email: app.email,
    amount: app.amountCents / 100,
  });
}
