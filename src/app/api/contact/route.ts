import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactEmails } from "@/lib/email";

export const runtime = "nodejs";

/**
 * POST /api/contact
 *
 * Routed contact form: validates the message, applies light anti-spam
 * measures, then emails the support inbox and sends the customer an
 * acknowledgement.
 *
 * Anti-spam:
 * - honeypot field ("company") that humans never see — bots that fill it get
 *   a fake success and nothing is sent
 * - per-IP throttle (in-memory, per serverless instance): 5 messages/hour.
 *   Best-effort only; good enough to blunt drive-by form spam.
 */

const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  email: z.string().trim().email("Please enter a valid email address."),
  reference: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v ? v : undefined)),
  message: z
    .string()
    .trim()
    .min(10, "Please tell us a bit more so we can help (at least 10 characters).")
    .max(5000, "Message is too long — please keep it under 5,000 characters."),
  /** Honeypot — humans never see this field; any content marks the message as spam. */
  company: z.string().optional(),
});

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function throttled(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_PER_WINDOW) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  // Keep the map from growing unbounded on long-lived instances.
  if (hits.size > 5000) {
    hits.forEach((times, key) => {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    });
  }
  return false;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".") || "form";
      (errors[path] ??= []).push(issue.message);
    }
    return NextResponse.json(
      { ok: false, message: "Please correct the highlighted fields.", errors },
      { status: 400 },
    );
  }

  // Honeypot tripped: pretend success, send nothing.
  if (parsed.data.company) {
    return NextResponse.json({ ok: true });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (throttled(ip)) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "You've sent several messages recently. Please wait a bit, or email support@reelpermit.local directly.",
      },
      { status: 429 },
    );
  }

  const { name, email, reference, message } = parsed.data;
  const result = await sendContactEmails({ name, email, reference, message });

  if (!result.admin.delivered && !result.ack.delivered) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "We couldn't send your message right now. Please email support@reelpermit.local directly.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
