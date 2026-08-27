import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { runAdminOpsAction } from "@/lib/admin-ops";
import { dbConfigured } from "@/lib/db";

export const runtime = "nodejs";

/**
 * POST /api/admin/ops — team actions via session cookie OR ADMIN_PANEL_SECRET.
 *
 * Actions: mark-processing | request-info | mark-future-pending | cancel | refund
 */

const bodySchema = z.object({
  secret: z.string().min(1).optional(),
  action: z.enum([
    "mark-processing",
    "request-info",
    "mark-future-pending",
    "cancel",
    "refund",
  ]),
  reference: z.string().min(4).max(60),
  message: z.string().max(2000).optional(),
  force: z.boolean().optional(),
  existingLicenseExpiresOn: z.string().max(32).optional(),
});

function secretMatches(provided: string): boolean {
  const expected = process.env.ADMIN_PANEL_SECRET;
  if (!expected) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const { secret, action, reference, message, force, existingLicenseExpiresOn } = parsed.data;
  const sessionOk = await isAdminAuthenticated();
  const secretOk = Boolean(secret && secretMatches(secret));
  if (!sessionOk && !secretOk) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }
  if (!dbConfigured()) {
    return NextResponse.json({ ok: false, message: "Database not configured." }, { status: 503 });
  }

  const result = await runAdminOpsAction({
    action,
    reference,
    message,
    force,
    existingLicenseExpiresOn,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message },
      { status: result.status ?? 400 },
    );
  }
  return NextResponse.json(result);
}
