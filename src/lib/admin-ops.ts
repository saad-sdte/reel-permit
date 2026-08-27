import { getStateConfig } from "@/lib/states";
import { refundTransaction, voidTransaction } from "@/lib/nmi";
import { q } from "@/lib/db";
import {
  getApplicationByReference,
  logPaymentEvent,
  markApplicationFuturePending,
  recordPayment,
  updateApplicationStatus,
  type ApplicationRecord,
} from "@/lib/storage";
import {
  opsAlert,
  sendCancelledEmail,
  sendMissingInfoEmail,
  sendRefundEmail,
  type LifecycleCtx,
} from "@/lib/email";

export type AdminOpsAction =
  | "mark-processing"
  | "request-info"
  | "mark-future-pending"
  | "cancel"
  | "refund";

export type AdminOpsResult =
  | { ok: true; status: string; emailed?: string; refundTransactionId?: string }
  | { ok: false; message: string; status?: number };

async function buildCtx(app: ApplicationRecord): Promise<LifecycleCtx> {
  const config = await getStateConfig(app.stateSlug);
  return {
    config,
    applicationId: app.id,
    reference: app.reference,
    stateSlug: app.stateSlug,
    firstName: app.firstName,
    fullName: [app.firstName, app.lastName].filter(Boolean).join(" ") || null,
    email: app.email ?? "",
    residency: app.residency,
    licenseId: app.licenseId,
    addOnIds: app.addOnIds,
    amount: app.amountCents / 100,
    maskedData: app.formData,
  };
}

export async function runAdminOpsAction(input: {
  action: AdminOpsAction;
  reference: string;
  message?: string;
  force?: boolean;
  /** YYYY-MM-DD — required for mark-future-pending */
  existingLicenseExpiresOn?: string;
}): Promise<AdminOpsResult> {
  const app = await getApplicationByReference(input.reference.trim());
  if (!app) {
    return { ok: false, message: `No application ${input.reference}.`, status: 404 };
  }
  const ctx = await buildCtx(app);
  const { action, message, force, existingLicenseExpiresOn } = input;

  if (action === "mark-processing") {
    await updateApplicationStatus(app.id, "processing", "admin");
    await logPaymentEvent({
      applicationId: app.id,
      source: "admin",
      eventType: "status_change",
      detail: { to: "processing" },
    });
    return { ok: true, status: "processing" };
  }

  if (action === "mark-future-pending") {
    const expiresOn = existingLicenseExpiresOn?.trim().slice(0, 10) ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiresOn)) {
      return {
        ok: false,
        message: "Enter the current license expiry date (YYYY-MM-DD).",
        status: 400,
      };
    }
    if (["cancelled", "refunded", "delivered"].includes(app.status)) {
      return { ok: false, message: `Cannot park a ${app.status} application.`, status: 409 };
    }
    const note = message?.trim() || "waiting for existing annual license to expire";
    await markApplicationFuturePending(app.id, expiresOn, note);
    await logPaymentEvent({
      applicationId: app.id,
      source: "admin",
      eventType: "status_change",
      detail: { to: "future_pending", existingLicenseExpiresOn: expiresOn },
    });
    return { ok: true, status: "future_pending" };
  }

  if (action === "request-info") {
    const ask = message?.trim();
    if (!ask) {
      return { ok: false, message: "Enter what you need from the customer.", status: 400 };
    }
    if (!app.email) {
      return { ok: false, message: "Application has no email on file.", status: 400 };
    }
    const result = await sendMissingInfoEmail(ctx, ask, { force });
    if (result.status === "failed") {
      return { ok: false, message: `Email failed: ${result.error}`, status: 502 };
    }
    if (result.status === "skipped") {
      return {
        ok: false,
        message: "A missing-info email was already sent. Check force to send another.",
        status: 409,
      };
    }
    await updateApplicationStatus(app.id, "missing_info", "awaiting customer detail");
    await logPaymentEvent({
      applicationId: app.id,
      source: "admin",
      eventType: "info_requested",
      detail: { askLength: ask.length },
    });
    return { ok: true, status: "missing_info", emailed: app.email };
  }

  if (action === "cancel") {
    if (["cancelled", "refunded"].includes(app.status)) {
      return { ok: false, message: `Already ${app.status}.`, status: 409 };
    }
    await updateApplicationStatus(app.id, "cancelled", message?.trim() || "cancelled by admin");
    await logPaymentEvent({
      applicationId: app.id,
      source: "admin",
      eventType: "status_change",
      detail: { to: "cancelled" },
    });
    if (app.email) await sendCancelledEmail(ctx);
    await opsAlert(
      `Application cancelled (manual) — ${app.reference}`,
      `Cancelled by admin. Customer: ${app.email ?? "no email"}.`,
    );
    return { ok: true, status: "cancelled" };
  }

  const pay = await q<{
    id: string;
    transaction_id: string | null;
    amount_cents: number;
    card_brand: string | null;
    card_last4: string | null;
    dev_mode: boolean;
  }>(
    `select id, transaction_id, amount_cents, card_brand, card_last4, dev_mode
       from payments
      where application_id = $1 and status = 'approved' and kind in ('sale','retry_sale')
      order by created_at desc limit 1`,
    [app.id],
  );
  const charge = pay.rows[0];
  if (!charge?.transaction_id) {
    return { ok: false, message: "No approved charge found to refund.", status: 409 };
  }
  if (app.status === "refunded") {
    return { ok: false, message: "Already refunded.", status: 409 };
  }

  const amount = charge.amount_cents / 100;
  let result = await refundTransaction(charge.transaction_id, amount);
  if (!result.ok) {
    const voided = await voidTransaction(charge.transaction_id);
    if (!voided.ok) {
      return {
        ok: false,
        message: `Gateway rejected refund (${result.message}) and void (${voided.message}).`,
        status: 502,
      };
    }
    result = voided;
  }

  const refundPaymentId = await recordPayment({
    applicationId: app.id,
    kind: "refund",
    source: "admin",
    transactionId: result.transactionId,
    amountCents: charge.amount_cents,
    status: "refunded",
    cardBrand: charge.card_brand ?? undefined,
    cardLast4: charge.card_last4 ?? undefined,
    devMode: result.devMode,
    idempotencyKey: `refund/${charge.transaction_id}`,
  }).catch(() => null);
  await updateApplicationStatus(app.id, "refunded", message?.trim() || "refunded by admin");
  await logPaymentEvent({
    applicationId: app.id,
    paymentId: refundPaymentId,
    source: "admin",
    eventType: "refund",
    detail: { refundTransactionId: result.transactionId, amountCents: charge.amount_cents },
  });
  if (app.email) {
    await sendRefundEmail(ctx, {
      refundTransactionId: result.transactionId,
      refundedAt: new Date(),
      cardBrand: charge.card_brand,
      cardLast4: charge.card_last4,
      amount,
    });
  }
  await opsAlert(
    `Refund issued — ${app.reference}`,
    [
      `Amount: $${amount.toFixed(2)} — refund transaction ${result.transactionId}`,
      `Original transaction: ${charge.transaction_id}${charge.dev_mode ? " (dev-mode)" : ""}`,
      `Customer: ${app.email ?? "no email"} — email #10 ${app.email ? "sent" : "skipped"}`,
    ].join("\n"),
  );
  return { ok: true, status: "refunded", refundTransactionId: result.transactionId };
}
