import { NextResponse } from "next/server";
import { getStateConfig } from "@/lib/states";
import {
  buildSubmissionSchema,
  computeOrderTotal,
  maskSensitiveFields,
} from "@/lib/state-config";
import { paymentDescriptor } from "@/lib/whop";
import {
  createOrReuseApplication,
  type StoredApplication,
} from "@/lib/storage";
import { sendCheckoutStartedEmails, type OrderEmailContext } from "@/lib/email";
import { persistApplicantUploads } from "@/lib/cloudinary";
import { missingRequiredIdUploads } from "@/lib/id-upload-requirements";

export const runtime = "nodejs";

function generateReference(stateSlug: string): string {
  const state = stateSlug.toUpperCase().replace(/-/g, "");
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomBytes = new Uint8Array(3);
  crypto.getRandomValues(randomBytes);
  const random = Array.from(randomBytes)
    .map((b) => (b % 36).toString(36))
    .join("")
    .toUpperCase()
    .slice(0, 4)
    .padStart(4, "0");
  return `RP-${state}-${timestamp}-${random}`;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/**
 * POST /api/applications/checkout-started
 *
 * Fired when the applicant finishes review and opens the payment step.
 * Validates form data (no payment token), saves pending_payment when a DB
 * is configured, and emails customer + admin (full applicant fields to admin).
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
  }

  const slug =
    typeof body === "object" && body && "stateSlug" in body
      ? String((body as { stateSlug?: string }).stateSlug ?? "")
      : "";
  const config = slug ? await getStateConfig(slug) : null;
  if (!config) {
    return NextResponse.json({ ok: false, message: "Unknown state" }, { status: 400 });
  }

  // Zod v4: cannot .omit() schemas that use .superRefine(). Stub payment so the
  // full submission schema can validate form data without a real card token.
  const schema = buildSubmissionSchema(config);
  const parsed = schema.safeParse({
    ...(typeof body === "object" && body ? body : {}),
    payment: { token: "tok_checkout_started_placeholder" },
  });
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".") || "_form";
      if (path.startsWith("payment")) continue;
      (errors[path] ??= []).push(issue.message);
    }
    if (Object.keys(errors).length) {
      return NextResponse.json({ ok: false, message: "Validation failed", errors }, { status: 400 });
    }
  }
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Validation failed" }, { status: 400 });
  }

  const uploadErrors = missingRequiredIdUploads(
    parsed.data.stateSlug,
    parsed.data.data as Record<string, unknown>,
  );
  if (Object.keys(uploadErrors).length) {
    return NextResponse.json(
      {
        ok: false,
        message: "Driver's License front and back uploads are required.",
        errors: uploadErrors,
      },
      { status: 400 },
    );
  }

  const submission = parsed.data;
  let applicationId: string | null = null;
  let reference = generateReference(submission.stateSlug);

  // Upload DL/ID data-URLs to Cloudinary; store HTTPS URLs in form_data.
  const formData = await persistApplicantUploads(submission.data, {
    stateSlug: submission.stateSlug,
    reference,
  });
  // Persist full applicant data for admin; mask only for outbound emails.
  const maskedData = maskSensitiveFields(config, formData);
  const amount = computeOrderTotal(config, submission.licenseId, submission.addOnIds);
  const amountCents = Math.round(amount * 100);
  const email = str(formData.email);
  const firstName = str(formData.firstName);
  const lastName = str(formData.lastName);
  const phone = str(formData.phone) ?? str(formData.primaryPhone);

  try {
    const created = await createOrReuseApplication({
      reference,
      stateSlug: submission.stateSlug,
      residency: submission.residency,
      licenseId: submission.licenseId,
      addOnIds: submission.addOnIds,
      email,
      firstName,
      lastName,
      phone,
      formData,
      consents: submission.consents,
      amountCents,
    });
    if (created) {
      applicationId = created.app.id;
      reference = created.app.reference;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `[checkout-started] persist failed: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }

  const app: StoredApplication = {
    reference,
    stateSlug: submission.stateSlug,
    residency: submission.residency,
    licenseId: submission.licenseId,
    addOnIds: submission.addOnIds,
    data: maskedData,
    consents: submission.consents,
    payment: {
      transactionId: "pending",
      amount,
      descriptor: paymentDescriptor(),
      devMode: true,
    },
    submittedAt: new Date().toISOString(),
  };

  const orderCtx: OrderEmailContext = {
    config,
    app,
    maskedData,
    rawData: submission.data,
  };

  const emails = await sendCheckoutStartedEmails(orderCtx, applicationId);

  return NextResponse.json({
    ok: true,
    reference,
    applicationId,
    customerEmailed: emails.customer.delivered,
    adminEmailed: emails.admin.delivered,
  });
}
