import { getStateConfig } from "@/lib/states";
import { maskSensitiveFields } from "@/lib/state-config";
import {
  hasApprovedPayment,
  logPaymentEvent,
  markApplicationPaid,
  recordPayment,
  type ApplicationRecord,
  type StoredApplication,
} from "@/lib/storage";
import { mongoUpsertApp } from "@/lib/mongo";
import {
  adminRecipients,
  sendApplicationReceivedEmail,
  sendEmail,
  sendPaymentReceiptEmail,
  type LifecycleCtx,
  type OrderEmailContext,
} from "@/lib/email";
import { adminNewOrderEmail } from "@/lib/email/templates";
import { paymentDescriptor } from "@/lib/whop";

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export async function fulfillPaidApplication(args: {
  app: ApplicationRecord;
  transactionId: string;
  amountUsd: number;
  last4?: string;
  brand?: string;
  source: "checkout" | "retry_page" | "webhook";
  rawResponse?: unknown;
  idempotencyKey?: string;
}): Promise<{ reference: string; emailedTo: string | null }> {
  const alreadyPaid =
    ["received", "processing", "delivered"].includes(args.app.status) ||
    (await hasApprovedPayment(args.app.id).catch(() => false));
  if (alreadyPaid) {
    return { reference: args.app.reference, emailedTo: args.app.email };
  }

  const descriptor = paymentDescriptor();
  const paidAt = new Date();
  const amountCents = Math.round(args.amountUsd * 100);
  const config = await getStateConfig(args.app.stateSlug);
  const maskedData = maskSensitiveFields(config, args.app.formData ?? {});
  const last4 = args.last4 && /^\d{4}$/.test(args.last4) ? args.last4 : undefined;
  const brand = args.brand ?? "card";

  const paymentId = await recordPayment({
    applicationId: args.app.id,
    kind: args.source === "retry_page" ? "retry_sale" : "sale",
    source: args.source,
    transactionId: args.transactionId,
    amountCents,
    status: "approved",
    cardBrand: brand,
    cardLast4: last4,
    descriptor,
    rawResponse: asRecord(args.rawResponse),
    idempotencyKey: args.idempotencyKey ?? `whop/${args.app.id}/${args.transactionId}`,
  }).catch(() => null);

  await markApplicationPaid(args.app.id, {}).catch(() => {});

  await mongoUpsertApp(
    {
      ...args.app,
      amountCents,
      status: "received",
      paidAt: paidAt.toISOString(),
      statusReason: null,
    },
    {
      transactionId: args.transactionId,
      last4,
      brand,
      descriptor,
    },
  ).catch(() => {});

  await logPaymentEvent({
    applicationId: args.app.id,
    paymentId,
    source: args.source,
    eventType: "approved",
    detail: { transactionId: args.transactionId, gateway: "whop" },
  }).catch(() => {});

  const firstName = args.app.firstName;
  const lastName = args.app.lastName;
  const email = args.app.email;
  const amount = args.amountUsd;

  const lifecycleCtx: LifecycleCtx = {
    config,
    applicationId: args.app.id,
    reference: args.app.reference,
    stateSlug: args.app.stateSlug,
    firstName,
    fullName: [firstName, lastName].filter(Boolean).join(" ") || null,
    email: email ?? "",
    residency: args.app.residency,
    licenseId: args.app.licenseId,
    addOnIds: args.app.addOnIds,
    amount,
    maskedData,
  };

  let emailedTo: string | null = null;
  if (email) {
    const [received, receipt] = await Promise.all([
      sendApplicationReceivedEmail(lifecycleCtx),
      sendPaymentReceiptEmail(lifecycleCtx, {
        brand,
        last4,
        transactionId: args.transactionId,
        paidAt,
      }),
    ]);
    if (received.status === "sent" || receipt.status === "sent") emailedTo = email;
  }

  const admins = adminRecipients();
  if (admins.length) {
    const stored: StoredApplication = {
      reference: args.app.reference,
      stateSlug: args.app.stateSlug,
      residency: args.app.residency,
      licenseId: args.app.licenseId,
      addOnIds: args.app.addOnIds,
      data: maskedData,
      consents: { accurateAndTerms: true },
      payment: {
        transactionId: args.transactionId,
        amount,
        last4,
        brand,
        descriptor,
        devMode: false,
      },
      submittedAt: args.app.submittedAt,
    };
    const adminTpl = adminNewOrderEmail(
      { config, app: stored, maskedData, rawData: args.app.formData } satisfies OrderEmailContext,
      { includeFullSSN: process.env.ADMIN_EMAIL_INCLUDE_FULL_SSN === "true" },
    );
    await sendEmail({
      applicationId: args.app.id,
      type: "ops_paid",
      to: admins,
      from: process.env.EMAIL_FROM ?? "ReelPermit <orders@reelpermit.com>",
      subject: `[RP Ops] ${adminTpl.subject}`,
      html: adminTpl.html,
      text: adminTpl.text,
      replyTo: email ?? undefined,
      meta: { amount, gateway: "whop", source: args.source },
    });
  }

  return { reference: args.app.reference, emailedTo };
}

/** Complete a $0 test promo without creating a processor session. */
export async function fulfillZeroPromoOrder(
  app: ApplicationRecord,
  promoCode: string,
  source: "checkout" | "retry_page",
): Promise<{ reference: string; emailedTo: string | null }> {
  return fulfillPaidApplication({
    app: { ...app, amountCents: 0 },
    transactionId: `PROMO-${promoCode}-${app.reference}`,
    amountUsd: 0,
    brand: "promo",
    source,
    idempotencyKey: `promo/${app.id}/${promoCode}`,
  });
}
