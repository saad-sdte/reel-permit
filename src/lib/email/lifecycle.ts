import type { StateConfig } from "@/lib/state-config";
import { formatPrice } from "@/lib/format";
import type { DeclineCode } from "@/lib/nmi";
import { NMI_DESCRIPTOR } from "@/lib/nmi";
import {
  BUSINESS,
  detailCard,
  detailRow,
  emailShell,
  esc,
  ctaButton,
  stepsBlock,
  textFooter,
  utmLink,
} from "./email-layout";
import { sendEmail, type SendEmailResult } from "./pipeline";
import { buildApplicantDetails } from "./applicant-details";

/**
 * Lifecycle emails #1 (Application Received), #2 (Payment Receipt) and
 * #4 (Payment Declined) — built on the shared design system and sent through
 * the idempotent sendEmail() pipeline.
 *
 * Copy source: the product spec (Part 5), adapted only where the repo is the
 * source of truth (reference format, bundled-pricing honesty rules).
 * PII: templates receive MASKED applicant data only (SSN -> ***-**-last4).
 */

/* ------------------------------------------------------------------ */
/* sender identities                                                   */
/* ------------------------------------------------------------------ */

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

const FROM = {
  applications: () =>
    env("EMAIL_FROM_APPLICATIONS") ?? "ReelPermit <applications@reelpermit.local>",
  receipts: () => env("EMAIL_FROM_RECEIPTS") ?? "ReelPermit <receipts@reelpermit.local>",
  billing: () => env("EMAIL_FROM_BILLING") ?? "ReelPermit Billing <billing@reelpermit.local>",
};

const replyTo = () => env("SUPPORT_REPLY_TO") ?? BUSINESS.supportEmail;

/* ------------------------------------------------------------------ */
/* formatting helpers                                                  */
/* ------------------------------------------------------------------ */

/** "July 28, 2026, 5:00 PM ET" — absolute dates with timezone, always. */
export function fmtDateTimeET(d: Date): string {
  const s = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
  return `${s} ET`;
}

/** "July 28, 2026" (Eastern calendar date). */
export function fmtDateET(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function titleCaseSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* ------------------------------------------------------------------ */
/* shared context                                                      */
/* ------------------------------------------------------------------ */

export interface LifecycleCtx {
  config: StateConfig | null;
  applicationId: string | null;
  reference: string;
  stateSlug: string;
  firstName: string | null;
  fullName: string | null;
  email: string;
  residency: string;
  licenseId: string;
  addOnIds: string[];
  /** Bundled total in dollars (server-computed). */
  amount: number;
  /** MASKED applicant form fields for inclusion in customer emails. */
  maskedData?: Record<string, unknown> | null;
}

function applicantSection(ctx: LifecycleCtx): { html: string; textLines: string[] } {
  return buildApplicantDetails(ctx.config, ctx.maskedData);
}

function stateName(ctx: LifecycleCtx): string {
  return ctx.config?.stateName ?? titleCaseSlug(ctx.stateSlug);
}

function license(ctx: LifecycleCtx) {
  return ctx.config?.licenses.find((l) => l.id === ctx.licenseId) ?? null;
}

function addOns(ctx: LifecycleCtx) {
  return (ctx.config?.addOns ?? []).filter((a) => ctx.addOnIds.includes(a.id));
}

function residencyLabel(ctx: LifecycleCtx): string {
  const opt = ctx.config?.residencyOptions?.find((r) => r.value === ctx.residency);
  return opt?.label ?? (ctx.residency ? titleCaseSlug(ctx.residency) : "—");
}

function greetingName(ctx: LifecycleCtx): string {
  return ctx.firstName?.trim() || "there";
}

/* ------------------------------------------------------------------ */
/* EMAIL #1 — Application Received                                     */
/* ------------------------------------------------------------------ */

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

export function buildApplicationReceivedEmail(ctx: LifecycleCtx): BuiltEmail {
  const state = stateName(ctx);
  const lic = license(ctx);
  const applicant = applicantSection(ctx);
  const subject = `We've received your ${state} fishing license application (${ctx.reference})`;
  const preheader =
    "Our team is reviewing it now — most applications are processed within 1 business day.";

  const steps = stepsBlock([
    {
      title: "We review your application",
      body: "A specialist checks every detail — typically within 1 business day.",
    },
    {
      title: "Your license lands in your inbox",
      body: "As soon as it's issued, we'll email it to you ready to print or save to your phone.",
    },
  ]);

  const rows = [
    detailRow("Reference", esc(ctx.reference), { mono: true, strong: true }),
    ctx.fullName ? detailRow("Applicant", esc(ctx.fullName)) : "",
    detailRow("State", esc(state)),
    lic ? detailRow("License", esc(lic.name)) : detailRow("License", esc(ctx.licenseId)),
    detailRow("Residency", esc(residencyLabel(ctx))),
    lic?.duration ? detailRow("Duration", esc(lic.duration)) : "",
    ...addOns(ctx).map((a) => detailRow("Add-on", esc(a.name))),
    detailRow("Amount paid", esc(formatPrice(ctx.amount)), { strong: true }),
  ].join("");

  const bodyHtml = `
    <h1 style="margin:0 0 14px;font-size:23px;line-height:1.3;font-weight:700;color:#0A2540;">Your application is in ✓</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#475569;">Hi ${esc(greetingName(ctx))},</p>
    <p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#475569;">
      Thanks for choosing ReelPermit. Your ${esc(state)} fishing license application is in —
      here's exactly what happens next:
    </p>
    ${steps}
    ${detailCard(rows, { heading: "Application summary" })}
    ${applicant.html}
    <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:#475569;">
      <strong style="color:#0A2540;">Nothing else is needed from you right now.</strong>
      If anything in your application needs a correction, reply to this email and we'll fix it
      before we process it.
    </p>
    <p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#64748B;">Your receipt is in a separate email.</p>`;

  const text = [
    `Hi ${greetingName(ctx)},`,
    "",
    `Thanks for choosing ReelPermit. Your ${state} fishing license application is in — here's exactly what happens next:`,
    "",
    "1. We review your application — a specialist checks every detail, typically within 1 business day.",
    "2. Your license lands in your inbox — ready to print or save to your phone.",
    "",
    "APPLICATION SUMMARY",
    `Reference:   ${ctx.reference}`,
    ...(ctx.fullName ? [`Applicant:   ${ctx.fullName}`] : []),
    `State:       ${state}`,
    `License:     ${lic?.name ?? ctx.licenseId}`,
    `Residency:   ${residencyLabel(ctx)}`,
    ...(lic?.duration ? [`Duration:    ${lic.duration}`] : []),
    ...addOns(ctx).map((a) => `Add-on:      ${a.name}`),
    `Amount paid: ${formatPrice(ctx.amount)}`,
    "",
    ...applicant.textLines,
    ...(applicant.textLines.length ? [""] : []),
    "Nothing else is needed from you right now. If anything needs a correction, just reply to this email.",
    "Your receipt is in a separate email.",
    textFooter({ reference: ctx.reference }),
  ].join("\n");

  return {
    subject,
    html: emailShell({
      preheader,
      bodyHtml,
      banner: { tone: "info", text: "Application received" },
      footerReference: ctx.reference,
      campaign: "application_received",
    }),
    text,
  };
}

export async function sendApplicationReceivedEmail(ctx: LifecycleCtx): Promise<SendEmailResult> {
  const tpl = buildApplicationReceivedEmail(ctx);
  return sendEmail({
    applicationId: ctx.applicationId,
    type: "application_received",
    to: ctx.email,
    from: FROM.applications(),
    replyTo: replyTo(),
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    meta: { state: ctx.stateSlug, licenseId: ctx.licenseId },
  });
}

/* ------------------------------------------------------------------ */
/* EMAIL #2 — Payment Receipt                                          */
/* ------------------------------------------------------------------ */

export interface ReceiptPayment {
  brand?: string;
  last4?: string;
  transactionId: string;
  paidAt: Date;
}

export function buildPaymentReceiptEmail(ctx: LifecycleCtx, pay: ReceiptPayment): BuiltEmail {
  const applicant = applicantSection(ctx);
  // Leading fish emoji distinguishes ReelPermit receipts from other brand inboxes.
  const subject = `🐟 Your ReelPermit receipt — ${formatPrice(ctx.amount)} (${ctx.reference})`;
  const preheader = "Payment confirmed. Fully refundable until your license purchase is completed.";

  // Receipt shows only the amount actually charged — no fee itemization.

  const method = [pay.brand, pay.last4 ? `ending ${pay.last4}` : ""].filter(Boolean).join(" ");
  const metaRows = [
    detailRow("Date", esc(fmtDateTimeET(pay.paidAt))),
    method ? detailRow("Payment method", esc(method)) : "",
    detailRow("Transaction ID", esc(pay.transactionId), { mono: true }),
    detailRow("Reference", esc(ctx.reference), { mono: true }),
  ].join("");

  const itemRows = detailRow("Total charged", esc(formatPrice(ctx.amount)), { strong: true });

  const bodyHtml = `
    <h1 style="margin:0 0 14px;font-size:23px;line-height:1.3;font-weight:700;color:#0A2540;">Payment receipt</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#475569;">Hi ${esc(greetingName(ctx))},</p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">
      Your payment went through successfully. Keep this receipt for your records.
    </p>
    ${detailCard(metaRows, { heading: "Payment details" })}
    ${detailCard(itemRows, { heading: "Receipt" })}
    ${applicant.html}
    <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#64748B;">
      This charge will appear on your statement as <strong style="color:#0A2540;">${esc(NMI_DESCRIPTOR)}</strong>.
    </p>
    <p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#64748B;">
      <strong style="color:#0A2540;">Refund policy:</strong> your payment is fully refundable any
      time before we complete your license purchase with the state. After that, the state fee is
      non-refundable per state rules — see our
      <a href="${utmLink("/refund", "payment_receipt")}" style="color:#175CD3;">Refund Policy</a>.
    </p>`;

  const text = [
    `Hi ${greetingName(ctx)},`,
    "",
    "Your payment went through successfully. Keep this receipt for your records.",
    "",
    "PAYMENT DETAILS",
    `Date:           ${fmtDateTimeET(pay.paidAt)}`,
    ...(method ? [`Payment method: ${method}`] : []),
    `Transaction ID: ${pay.transactionId}`,
    `Reference:      ${ctx.reference}`,
    "",
    "RECEIPT",
    `Total charged: ${formatPrice(ctx.amount)}`,
    "",
    ...applicant.textLines,
    ...(applicant.textLines.length ? [""] : []),
    `This charge will appear on your statement as ${NMI_DESCRIPTOR}.`,
    "",
    "Refund policy: your payment is fully refundable any time before we complete your license purchase with the state. After that, the state fee is non-refundable per state rules.",
    textFooter({ reference: ctx.reference }),
  ].join("\n");

  return {
    subject,
    html: emailShell({
      preheader,
      bodyHtml,
      banner: { tone: "success", text: "Payment received" },
      footerReference: ctx.reference,
      campaign: "payment_receipt",
    }),
    text,
  };
}

export async function sendPaymentReceiptEmail(
  ctx: LifecycleCtx,
  pay: ReceiptPayment,
): Promise<SendEmailResult> {
  const tpl = buildPaymentReceiptEmail(ctx, pay);
  return sendEmail({
    applicationId: ctx.applicationId,
    type: "payment_receipt",
    to: ctx.email,
    from: FROM.receipts(),
    replyTo: replyTo(),
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    meta: { transactionId: pay.transactionId, amount: ctx.amount },
  });
}

/* ------------------------------------------------------------------ */
/* EMAIL #4 — Payment Declined (Day 0)                                 */
/* ------------------------------------------------------------------ */

/** Decline-reason → one-sentence dunning hint (concierge tone, never blame). */
const DECLINE_HINTS: Record<DeclineCode, string> = {
  insufficient_funds:
    "This usually happens when a card is temporarily short on funds — try again in a moment, or use a different card.",
  expired_card:
    "This usually happens when a card has expired — double-check the expiry date or use a different card.",
  incorrect_card:
    "The billing details didn't match your bank's records — re-enter them carefully and try again.",
  invalid_cvv:
    "The security code (CVV) didn't match — re-enter it carefully; it's the 3-digit code on the back (4 on Amex).",
  over_limit:
    "The card appears to be over its limit — a different card usually does the trick.",
  do_not_honor:
    "Your bank declined the charge — a quick call to the number on the back of your card usually clears it, or you can simply try another card.",
  generic_decline:
    "Your bank declined the charge — a quick call to the number on the back of your card usually clears it, or you can simply try another card.",
  retry_later:
    "Your bank declined the charge for now — trying again tomorrow, or using a different card, usually works.",
  suspected_fraud:
    "Your bank declined the charge — please contact your bank, or simply use a different card.",
  duplicate_transaction:
    "This looked like a duplicate payment attempt — if you already paid, your receipt is in your inbox; otherwise try again in a few minutes.",
  card_not_supported:
    "This card type isn't supported for this purchase — a Visa, Mastercard, Amex or Discover card will work.",
  processor_error:
    "A temporary processing hiccup got in the way — trying again now usually works.",
  gateway_error:
    "A temporary processing hiccup got in the way — trying again now usually works.",
};

export interface DeclinedEmailInput {
  declineCode: DeclineCode;
  /** Secure retry link (/pay/{token}); falls back to the state page. */
  retryUrl: string | null;
  /** Hold deadline — decline + 7 days. */
  holdExpiry: Date;
}

export function buildPaymentDeclinedEmail(ctx: LifecycleCtx, input: DeclinedEmailInput): BuiltEmail {
  const state = stateName(ctx);
  const applicant = applicantSection(ctx);
  const subject = `Action needed: your payment didn't go through (${ctx.reference})`;
  const preheader =
    "No charge was made. It takes about 60 seconds to try again with the same or a different card.";
  const hint = DECLINE_HINTS[input.declineCode] ?? DECLINE_HINTS.generic_decline;
  const holdDate = fmtDateET(input.holdExpiry);
  const retryUrl = input.retryUrl ?? utmLink(`/${ctx.stateSlug}`, "payment_declined");

  const bodyHtml = `
    <h1 style="margin:0 0 14px;font-size:23px;line-height:1.3;font-weight:700;color:#0A2540;">Your payment didn't go through</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#475569;">Hi ${esc(greetingName(ctx))},</p>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#475569;">
      We couldn't process your payment of <strong style="color:#0A2540;">${esc(formatPrice(ctx.amount))}</strong>
      for your ${esc(state)} fishing license application — <strong style="color:#0A2540;">you have not
      been charged</strong>, and your application is saved and waiting.
    </p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">${esc(hint)}</p>
    ${ctaButton(retryUrl, "Complete your payment securely")}
    <p style="margin:6px 0 0;text-align:center;font-size:12px;color:#64748B;">Takes about 60 seconds · card details are never stored on our servers</p>
    ${applicant.html}
    <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:#475569;">
      We'll hold your application until <strong style="color:#0A2540;">${esc(holdDate)}</strong> (7 days).
      After that it's cancelled automatically and nothing is charged.
    </p>
    <p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#64748B;">
      If you'd rather not continue, no action is needed — the application will simply expire.
      Questions? Just reply.
    </p>`;

  const text = [
    `Hi ${greetingName(ctx)},`,
    "",
    `We couldn't process your payment of ${formatPrice(ctx.amount)} for your ${state} fishing license application — you have NOT been charged, and your application is saved and waiting.`,
    "",
    hint,
    "",
    "Complete your payment securely (takes about 60 seconds):",
    retryUrl,
    "",
    ...applicant.textLines,
    ...(applicant.textLines.length ? [""] : []),
    `We'll hold your application until ${holdDate} (7 days). After that it's cancelled automatically and nothing is charged.`,
    "",
    "If you'd rather not continue, no action is needed — the application will simply expire. Questions? Just reply.",
    textFooter({ reference: ctx.reference }),
  ].join("\n");

  return {
    subject,
    html: emailShell({
      preheader,
      bodyHtml,
      banner: { tone: "warning", text: "Action needed: payment unsuccessful" },
      footerReference: ctx.reference,
      campaign: "payment_declined",
    }),
    text,
  };
}

export async function sendPaymentDeclinedEmail(
  ctx: LifecycleCtx,
  input: DeclinedEmailInput,
): Promise<SendEmailResult> {
  const tpl = buildPaymentDeclinedEmail(ctx, input);
  return sendEmail({
    applicationId: ctx.applicationId,
    type: "payment_declined",
    to: ctx.email,
    from: FROM.billing(),
    replyTo: replyTo(),
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    meta: { declineCode: input.declineCode },
  });
}

/* ------------------------------------------------------------------ */
/* EMAILS #5–#7 — dunning reminders (Day 2 / Day 4 / Day 7)            */
/* ------------------------------------------------------------------ */

export interface DunningEmailInput {
  retryUrl: string;
  /** One-click pause link — REQUIRED on reminders (#5–#7 only). */
  pauseUrl: string;
  /** Hold deadline — decline + 7 days. */
  holdExpiry: Date;
  cardBrand?: string | null;
  cardLast4?: string | null;
}

function unsubscribeHeaders(pauseUrl: string): Record<string, string> {
  // RFC 8058 one-click: mail clients POST to the URL without rendering it.
  const oneClick = `${pauseUrl}${pauseUrl.includes("?") ? "&" : "?"}one_click=1`;
  return {
    "List-Unsubscribe": `<${oneClick}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

function miniRecap(ctx: LifecycleCtx): string {
  const lic = license(ctx);
  const rows = [
    detailRow(lic?.name ?? ctx.licenseId, esc(stateName(ctx))),
    detailRow("Total", esc(formatPrice(ctx.amount)), { strong: true }),
  ].join("");
  return detailCard(rows, { heading: "Your order" });
}

/** EMAIL #5 — Payment Reminder 1 (Day 2). */
export function buildReminder1Email(ctx: LifecycleCtx, input: DunningEmailInput): BuiltEmail {
  const state = stateName(ctx);
  const applicant = applicantSection(ctx);
  const subject = `Your ${state} fishing license application is on hold (${ctx.reference})`;
  const preheader = "Everything's ready on our side — completing payment takes about a minute.";
  const card = [input.cardBrand, input.cardLast4 ? `card ending ${input.cardLast4}` : "card"]
    .filter(Boolean)
    .join(" ");
  const holdDate = fmtDateET(input.holdExpiry);

  const bodyHtml = `
    <h1 style="margin:0 0 14px;font-size:23px;line-height:1.3;font-weight:700;color:#0A2540;">Your application is on hold</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#475569;">Hi ${esc(greetingName(ctx))},</p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">
      Quick reminder: your ${esc(state)} fishing license application is complete and saved, but we
      can't start processing it until payment goes through. The earlier attempt with your
      ${esc(card)} didn't succeed — this is usually a small card issue, nothing more.
    </p>
    ${ctaButton(input.retryUrl, `Finish your application — pay ${formatPrice(ctx.amount)}`)}
    <p style="margin:6px 0 0;text-align:center;font-size:12px;color:#64748B;">Takes about a minute · no login needed</p>
    ${miniRecap(ctx)}
    ${applicant.html}
    <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:#475569;">
      Your application is held until <strong style="color:#0A2540;">${esc(holdDate)}</strong>.
      Reply to this email if you'd like help or want to pay a different way.
    </p>`;

  const text = [
    `Hi ${greetingName(ctx)},`,
    "",
    `Quick reminder: your ${state} fishing license application is complete and saved, but we can't start processing it until payment goes through. The earlier attempt with your ${card} didn't succeed — this is usually a small card issue, nothing more.`,
    "",
    `Finish your application — pay ${formatPrice(ctx.amount)}:`,
    input.retryUrl,
    "",
    `YOUR ORDER`,
    `${license(ctx)?.name ?? ctx.licenseId} — ${state}`,
    `Total: ${formatPrice(ctx.amount)}`,
    "",
    ...applicant.textLines,
    ...(applicant.textLines.length ? [""] : []),
    `Your application is held until ${holdDate}. Reply to this email if you'd like help or want to pay a different way.`,
    textFooter({ reference: ctx.reference, pauseUrl: input.pauseUrl }),
  ].join("\n");

  return {
    subject,
    html: emailShell({
      preheader,
      bodyHtml,
      banner: { tone: "warning", text: "Application on hold — payment needed" },
      footerReference: ctx.reference,
      pauseUrl: input.pauseUrl,
      campaign: "payment_reminder_1",
    }),
    text,
  };
}

/** EMAIL #6 — Payment Reminder 2 (Day 4, value angle). */
export function buildReminder2Email(ctx: LifecycleCtx, input: DunningEmailInput): BuiltEmail {
  const state = stateName(ctx);
  const applicant = applicantSection(ctx);
  const subject = `Still planning to fish in ${state}? (${ctx.reference})`;
  const preheader = "Your application expires in 3 days — finish payment in about a minute.";
  const holdDate = fmtDateET(input.holdExpiry);

  const bodyHtml = `
    <h1 style="margin:0 0 14px;font-size:23px;line-height:1.3;font-weight:700;color:#0A2540;">Still planning to fish in ${esc(state)}?</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#475569;">Hi ${esc(greetingName(ctx))},</p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">
      Your ${esc(state)} fishing trip shouldn't get stuck on a card hiccup. Your application is
      still saved — one quick payment and our team takes it from there: we review it, purchase
      your license through ${esc(state)}'s official system, and email it straight to your inbox.
    </p>
    ${ctaButton(input.retryUrl, `Complete payment — ${formatPrice(ctx.amount)}`)}
    ${applicant.html}
    <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:#475569;">
      After <strong style="color:#0A2540;">${esc(holdDate)}</strong> the application expires and
      your details are removed from our processing queue. If you hit any trouble paying, reply —
      a real person will help you sort it out.
    </p>`;

  const text = [
    `Hi ${greetingName(ctx)},`,
    "",
    `Your ${state} fishing trip shouldn't get stuck on a card hiccup. Your application is still saved — one quick payment and our team takes it from there: we review it, purchase your license through ${state}'s official system, and email it straight to your inbox.`,
    "",
    `Complete payment — ${formatPrice(ctx.amount)}:`,
    input.retryUrl,
    "",
    ...applicant.textLines,
    ...(applicant.textLines.length ? [""] : []),
    `After ${holdDate} the application expires and your details are removed from our processing queue. If you hit any trouble paying, reply — a real person will help you sort it out.`,
    textFooter({ reference: ctx.reference, pauseUrl: input.pauseUrl }),
  ].join("\n");

  return {
    subject,
    html: emailShell({
      preheader,
      bodyHtml,
      banner: { tone: "warning", text: "3 days left on your application" },
      footerReference: ctx.reference,
      pauseUrl: input.pauseUrl,
      campaign: "payment_reminder_2",
    }),
    text,
  };
}

/** EMAIL #7 — Final Notice (Day 7; direct, still courteous). */
export function buildFinalNoticeEmail(ctx: LifecycleCtx, input: DunningEmailInput): BuiltEmail {
  const state = stateName(ctx);
  const applicant = applicantSection(ctx);
  const subject = `Last day: application ${ctx.reference} expires tomorrow`;
  const holdDate = fmtDateET(input.holdExpiry);
  const preheader = `Complete payment today to keep your ${state} license application — otherwise it's cancelled automatically.`;

  const bodyHtml = `
    <h1 style="margin:0 0 14px;font-size:23px;line-height:1.3;font-weight:700;color:#0A2540;">Your application expires tomorrow</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#475569;">Hi ${esc(greetingName(ctx))},</p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">
      This is the last reminder we'll send. Your ${esc(state)} fishing license application
      (<span style="font-family:'SF Mono',SFMono-Regular,Consolas,Menlo,monospace;">${esc(ctx.reference)}</span>)
      expires tomorrow, <strong style="color:#0A2540;">${esc(holdDate)}</strong>, and will be
      cancelled automatically. You haven't been charged anything.
    </p>
    ${ctaButton(input.retryUrl, `Complete payment now — ${formatPrice(ctx.amount)}`)}
    ${applicant.html}
    <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:#475569;">
      <strong style="color:#0A2540;">If the card keeps declining:</strong> try a different card,
      or call the number on the back of your card — banks often clear the charge in one short
      call. Or just reply to this email and we'll figure it out together.
    </p>
    <p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#64748B;">
      If we don't hear from you, no worries — the application simply closes and your payment
      details are never charged.
    </p>`;

  const text = [
    `Hi ${greetingName(ctx)},`,
    "",
    `This is the last reminder we'll send. Your ${state} fishing license application (${ctx.reference}) expires tomorrow, ${holdDate}, and will be cancelled automatically. You haven't been charged anything.`,
    "",
    `Complete payment now — ${formatPrice(ctx.amount)}:`,
    input.retryUrl,
    "",
    ...applicant.textLines,
    ...(applicant.textLines.length ? [""] : []),
    "If the card keeps declining: try a different card, or call the number on the back of your card — banks often clear the charge in one short call. Or just reply to this email and we'll figure it out together.",
    "",
    "If we don't hear from you, no worries — the application simply closes and your payment details are never charged.",
    textFooter({ reference: ctx.reference, pauseUrl: input.pauseUrl }),
  ].join("\n");

  return {
    subject,
    html: emailShell({
      preheader,
      bodyHtml,
      banner: { tone: "error", text: "Expires tomorrow" },
      footerReference: ctx.reference,
      pauseUrl: input.pauseUrl,
      campaign: "final_notice",
    }),
    text,
  };
}

/* ------------------------------------------------------------------ */
/* EMAIL #8 — Application Cancelled (Day 8 auto-cancel / manual)       */
/* ------------------------------------------------------------------ */

export function buildCancelledEmail(ctx: LifecycleCtx): BuiltEmail {
  const state = stateName(ctx);
  const applicant = applicantSection(ctx);
  const subject = `Your application ${ctx.reference} has been cancelled`;
  const preheader = "Nothing was charged. You can restart in about 2 minutes whenever you're ready.";
  const newAppUrl = utmLink(`/${ctx.stateSlug}`, "application_cancelled");

  const bodyHtml = `
    <h1 style="margin:0 0 14px;font-size:23px;line-height:1.3;font-weight:700;color:#0A2540;">Your application has been cancelled</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#475569;">Hi ${esc(greetingName(ctx))},</p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">
      As planned, we've cancelled your ${esc(state)} fishing license application because payment
      wasn't completed. <strong style="color:#0A2540;">You were not charged</strong>, and your
      saved payment attempt details have been discarded. Remaining application data is deleted
      from our systems within 30 days per our
      <a href="${utmLink("/privacy", "application_cancelled")}" style="color:#175CD3;">Privacy Policy</a>.
    </p>
    ${applicant.html}
    <p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#475569;">
      Changed your mind? You can start a fresh application any time — it takes about 2 minutes:
    </p>
    ${ctaButton(newAppUrl, "Start a new application")}`;

  const text = [
    `Hi ${greetingName(ctx)},`,
    "",
    `As planned, we've cancelled your ${state} fishing license application because payment wasn't completed. You were NOT charged, and your saved payment attempt details have been discarded. Remaining application data is deleted from our systems within 30 days per our Privacy Policy.`,
    "",
    ...applicant.textLines,
    ...(applicant.textLines.length ? [""] : []),
    "Changed your mind? You can start a fresh application any time — it takes about 2 minutes:",
    newAppUrl,
    textFooter({ reference: ctx.reference }),
  ].join("\n");

  return {
    subject,
    html: emailShell({
      preheader,
      bodyHtml,
      banner: { tone: "info", text: "Application cancelled — no charge made" },
      footerReference: ctx.reference,
      campaign: "application_cancelled",
    }),
    text,
  };
}

/* ------------------------------------------------------------------ */
/* dunning senders (cron entry points)                                 */
/* ------------------------------------------------------------------ */

const DUNNING_BUILDERS: Record<
  number,
  { type: string; build: (ctx: LifecycleCtx, input: DunningEmailInput) => BuiltEmail }
> = {
  2: { type: "payment_reminder", build: buildReminder1Email },
  4: { type: "payment_reminder", build: buildReminder2Email },
  7: { type: "final_notice", build: buildFinalNoticeEmail },
};

/** Send the dunning email for a given step (2 | 4 | 7). */
export async function sendDunningStepEmail(
  ctx: LifecycleCtx,
  step: 2 | 4 | 7,
  input: DunningEmailInput,
): Promise<SendEmailResult> {
  const entry = DUNNING_BUILDERS[step];
  const tpl = entry.build(ctx, input);
  return sendEmail({
    applicationId: ctx.applicationId,
    type: entry.type,
    sequenceStep: step,
    to: ctx.email,
    from: FROM.billing(),
    replyTo: replyTo(),
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    headers: unsubscribeHeaders(input.pauseUrl),
    meta: { step },
  });
}

/** Send email #8 (cancelled). */
export async function sendCancelledEmail(ctx: LifecycleCtx): Promise<SendEmailResult> {
  const tpl = buildCancelledEmail(ctx);
  return sendEmail({
    applicationId: ctx.applicationId,
    type: "application_cancelled",
    to: ctx.email,
    from: FROM.billing(),
    replyTo: replyTo(),
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    meta: {},
  });
}

/* ------------------------------------------------------------------ */
/* EMAIL #3 — License Delivered (the moment of delight)                */
/* ------------------------------------------------------------------ */

export interface LicenseDeliveredInput {
  licenseNumber?: string | null;
  validFrom?: string | null; // ISO date
  validTo?: string | null; // ISO date
  /** Attachment filenames (for the copy) — attachments ride on sendEmail. */
  attachmentNames: string[];
  /** Optional personal note from the ops team. */
  note?: string | null;
}

function fmtDateOnly(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : fmtDateET(d);
}

function attachmentCallout(names: string[]): string {
  const list = names.length
    ? names
        .map(
          (n) =>
            `<tr><td style="padding:6px 0;font-size:14px;font-weight:700;color:#0A2540;">📄 ${esc(n)}</td></tr>`,
        )
        .join("")
    : `<tr><td style="padding:6px 0;font-size:14px;font-weight:700;color:#0A2540;">📄 Your fishing license (PDF)</td></tr>`;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;border-radius:14px;background:linear-gradient(135deg,#ECFDF3 0%,#F0F7F4 100%);border:1px solid #ABEFC6;">
      <tr><td style="padding:18px 22px;">
        <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#067647;">Attached to this email</p>
        <p style="margin:8px 0 0;font-size:15px;line-height:1.5;color:#14532D;">
          Open the paperclip / attachment in your mail app — your official license file is ready to save or print.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 0;">${list}</table>
      </td></tr>
    </table>`;
}

export function buildLicenseDeliveredEmail(
  ctx: LifecycleCtx,
  input: LicenseDeliveredInput,
): BuiltEmail {
  const state = stateName(ctx);
  const lic = license(ctx);
  const applicant = applicantSection(ctx);
  const agency = ctx.config?.officialAgencyName ?? `${state}'s licensing agency`;
  const agencyUrl = ctx.config?.officialPortalUrl ?? null;
  const subject = `Your ${state} fishing license is ready — ${ctx.reference}`;
  const preheader =
    "PDF attached — print it or save it to your phone before you head out.";

  const validRange = [
    input.validFrom ? fmtDateOnly(input.validFrom) : "",
    input.validTo ? fmtDateOnly(input.validTo) : "",
  ]
    .filter(Boolean)
    .join(" – ");

  const hero = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 6px;border-radius:16px;background:#0A2540;">
      <tr><td style="padding:28px 24px;text-align:center;">
        <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8AADD1;">License delivered</p>
        <h1 style="margin:10px 0 0;font-size:26px;line-height:1.25;font-weight:800;color:#FFFFFF;">You're cleared to fish, ${esc(greetingName(ctx))}.</h1>
        <p style="margin:12px 0 0;font-size:15px;line-height:1.55;color:#DCE7F2;">
          Your <strong style="color:#FFFFFF;">${esc(state)}</strong> fishing license is issued and
          <strong style="color:#FFFFFF;">attached as a PDF</strong> to this email.
        </p>
      </td></tr>
    </table>`;

  const licenseRows = [
    ctx.fullName ? detailRow("License holder", esc(ctx.fullName), { strong: true }) : "",
    input.licenseNumber
      ? detailRow("License number", esc(input.licenseNumber), { mono: true, strong: true })
      : "",
    lic ? detailRow("License type", esc(lic.name)) : detailRow("License", esc(ctx.licenseId)),
    detailRow("State", esc(state)),
    detailRow("Residency", esc(residencyLabel(ctx))),
    ...addOns(ctx).map((a) => detailRow("Add-on", esc(a.name))),
    validRange ? detailRow("Valid", esc(validRange), { strong: true }) : "",
    detailRow("Issued by", esc(agency)),
    detailRow("Order total", esc(formatPrice(ctx.amount)), { strong: true }),
    detailRow("Reference", esc(ctx.reference), { mono: true }),
  ].join("");

  const orderRows = [
    detailRow("Applicant", esc(ctx.fullName || greetingName(ctx))),
    detailRow("Email", esc(ctx.email)),
    detailRow("State", esc(state)),
    lic ? detailRow("Product", esc(lic.name)) : "",
    detailRow("Residency", esc(residencyLabel(ctx))),
    detailRow("Amount paid", esc(formatPrice(ctx.amount)), { strong: true }),
    detailRow("Reference", esc(ctx.reference), { mono: true }),
  ].join("");

  const steps = stepsBlock([
    {
      title: "Download the PDF",
      body: "Use the attachment on this email — save it to your phone and keep a backup in your inbox.",
    },
    {
      title: "Carry it when you fish",
      body: `${agency} issued this license. Keep a printed or phone copy with you on the water.`,
    },
    {
      title: "Follow state rules",
      body: `Seasons, size and bag limits are set by ${agency}${agencyUrl ? ` — ${agencyUrl}` : ""}.`,
    },
  ]);

  const expiryLine = input.validTo
    ? `<p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#475569;">Expires <strong style="color:#0A2540;">${esc(fmtDateOnly(input.validTo))}</strong> — we'll remind you before renewal.</p>`
    : "";
  const noteHtml = input.note
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;border-left:3px solid #2D6A4F;background:#F0F7F4;border-radius:0 10px 10px 0;">
        <tr><td style="padding:14px 18px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#1B4332;">Note from our team</p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#14532D;white-space:pre-wrap;">${esc(input.note)}</p>
        </td></tr>
      </table>`
    : "";

  const bodyHtml = `
    ${hero}
    ${attachmentCallout(input.attachmentNames)}
    ${detailCard(licenseRows, { heading: "Your license" })}
    ${detailCard(orderRows, { heading: "Order summary" })}
    ${applicant.html}
    <p style="margin:22px 0 0;font-size:15px;font-weight:700;color:#0A2540;">Before you head out</p>
    ${steps}
    ${expiryLine}
    ${noteHtml}
    <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:#475569;">
      Tight lines. If anything on the license looks wrong, reply to this email with your reference number and we'll fix it with the state.
    </p>`;

  const text = [
    `Hi ${greetingName(ctx)},`,
    "",
    `Your ${state} fishing license is ready. The PDF is ATTACHED to this email (${input.attachmentNames.join(", ") || "license.pdf"}).`,
    "",
    "YOUR LICENSE",
    ...(ctx.fullName ? [`License holder: ${ctx.fullName}`] : []),
    ...(input.licenseNumber ? [`License number: ${input.licenseNumber}`] : []),
    ...(lic ? [`License type: ${lic.name}`] : []),
    `State: ${state}`,
    `Residency: ${residencyLabel(ctx)}`,
    ...(validRange ? [`Valid: ${validRange}`] : []),
    `Issued by: ${agency}`,
    `Order total: ${formatPrice(ctx.amount)}`,
    `Reference: ${ctx.reference}`,
    "",
    "ORDER SUMMARY",
    `Applicant: ${ctx.fullName || greetingName(ctx)}`,
    `Email: ${ctx.email}`,
    `Amount paid: ${formatPrice(ctx.amount)}`,
    "",
    ...applicant.textLines,
    ...(applicant.textLines.length ? [""] : []),
    "BEFORE YOU HEAD OUT",
    "1. Download the PDF attachment and save it to your phone.",
    "2. Carry a copy whenever you fish.",
    `3. Follow rules from ${agency}${agencyUrl ? `: ${agencyUrl}` : ""}.`,
    ...(input.validTo
      ? ["", `Expires ${fmtDateOnly(input.validTo)} — we'll remind you before renewal.`]
      : []),
    ...(input.note ? ["", `Note from our team: ${input.note}`] : []),
    "",
    "If anything looks wrong, reply with your reference number.",
    textFooter({ reference: ctx.reference }),
  ].join("\n");

  return {
    subject,
    html: emailShell({
      preheader,
      bodyHtml,
      kicker: "License delivered",
      banner: { tone: "success", text: "Official license PDF attached" },
      footerReference: ctx.reference,
      campaign: "license_delivered",
    }),
    text,
  };
}

/** Internal ops copy of license delivery — full applicant dump + same PDF. */
export function buildLicenseDeliveredOpsEmail(
  ctx: LifecycleCtx,
  input: LicenseDeliveredInput,
): BuiltEmail {
  const state = stateName(ctx);
  const lic = license(ctx);
  const applicant = buildApplicantDetails(ctx.config, ctx.maskedData, {
    heading: "Applicant details (masked SSN)",
  });
  const subject = `License delivered to customer — ${ctx.reference}`;
  const rows = [
    detailRow("Customer email", esc(ctx.email), { strong: true }),
    detailRow("Customer name", esc(ctx.fullName || "—")),
    detailRow("Reference", esc(ctx.reference), { mono: true, strong: true }),
    detailRow("State", esc(state)),
    lic ? detailRow("License", esc(lic.name)) : detailRow("License id", esc(ctx.licenseId)),
    detailRow("Residency", esc(residencyLabel(ctx))),
    ...addOns(ctx).map((a) => detailRow("Add-on", esc(a.name))),
    detailRow("Amount", esc(formatPrice(ctx.amount)), { strong: true }),
    input.licenseNumber
      ? detailRow("License number", esc(input.licenseNumber), { mono: true })
      : "",
    input.validFrom ? detailRow("Valid from", esc(fmtDateOnly(input.validFrom))) : "",
    input.validTo ? detailRow("Valid to", esc(fmtDateOnly(input.validTo))) : "",
    detailRow(
      "Attachments",
      esc(input.attachmentNames.join(", ") || "(none)"),
      { strong: true },
    ),
    input.note ? detailRow("Team note", esc(input.note)) : "",
  ].join("");

  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#0A2540;">License delivery confirmed</h1>
    <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#475569;">
      The branded customer email was sent with the license PDF attached. Same file is attached here for your records.
    </p>
    ${detailCard(rows, { heading: "Delivery summary" })}
    ${applicant.html}`;

  const text = [
    "LICENSE DELIVERY CONFIRMED",
    "",
    `Customer: ${ctx.fullName || "—"} <${ctx.email}>`,
    `Reference: ${ctx.reference}`,
    `State: ${state}`,
    `License: ${lic?.name ?? ctx.licenseId}`,
    `Amount: ${formatPrice(ctx.amount)}`,
    ...(input.licenseNumber ? [`License number: ${input.licenseNumber}`] : []),
    `Files: ${input.attachmentNames.join(", ")}`,
    "",
    ...applicant.textLines,
  ].join("\n");

  return {
    subject,
    html: emailShell({
      preheader: `Delivered ${ctx.reference} to ${ctx.email}`,
      bodyHtml,
      kicker: "Ops · License delivered",
      banner: { tone: "success", text: "Customer email + PDF sent" },
      footerReference: ctx.reference,
      campaign: "ops_license_delivered",
    }),
    text,
  };
}

export async function sendLicenseDeliveredEmail(
  ctx: LifecycleCtx,
  input: LicenseDeliveredInput,
  attachments: Array<{ filename: string; content: Buffer; contentType?: string }>,
  opts?: { force?: boolean },
): Promise<SendEmailResult> {
  const tpl = buildLicenseDeliveredEmail(ctx, input);
  const from =
    env("EMAIL_FROM_LICENSES") ??
    FROM.applications();
  return sendEmail({
    applicationId: ctx.applicationId,
    type: "license_delivered",
    to: ctx.email,
    from,
    replyTo: replyTo(),
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    attachments,
    force: opts?.force,
    meta: { files: input.attachmentNames.length, licenseNumber: input.licenseNumber ?? null },
  });
}

/* ------------------------------------------------------------------ */
/* EMAIL #9 — Missing Information (ops-triggered)                      */
/* ------------------------------------------------------------------ */

export function buildMissingInfoEmail(ctx: LifecycleCtx, ask: string): BuiltEmail {
  const state = stateName(ctx);
  const applicant = applicantSection(ctx);
  const subject = `One quick thing before we can process ${ctx.reference}`;
  const preheader = `Your ${state} license application is almost ready — we just need one detail.`;

  const bodyHtml = `
    <h1 style="margin:0 0 14px;font-size:23px;line-height:1.3;font-weight:700;color:#0A2540;">We need one more detail</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#475569;">Hi ${esc(greetingName(ctx))},</p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">
      Your ${esc(state)} fishing license application is almost ready — before we can submit it,
      we need one thing from you:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;border-left:4px solid #B54708;background:#FFFAEB;border-radius:0 10px 10px 0;">
      <tr><td style="padding:14px 18px;">
        <p style="margin:0;font-size:15px;line-height:1.65;color:#0A2540;font-weight:500;">${esc(ask)}</p>
      </td></tr>
    </table>
    ${applicant.html}
    <p style="margin:18px 0 0;font-size:15px;line-height:1.6;color:#475569;">
      <strong style="color:#0A2540;">Just reply to this email</strong> with the detail above and
      we'll pick your application right back up — your place in the queue is saved.
    </p>
    <p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#64748B;">
      Please reply within 7 days to keep your application moving. Never include your full Social
      Security number or card details in an email reply.
    </p>`;

  const text = [
    `Hi ${greetingName(ctx)},`,
    "",
    `Your ${state} fishing license application is almost ready — before we can submit it, we need one thing from you:`,
    "",
    `>> ${ask}`,
    "",
    ...applicant.textLines,
    ...(applicant.textLines.length ? [""] : []),
    "Just reply to this email with the detail above and we'll pick your application right back up — your place in the queue is saved.",
    "",
    "Please reply within 7 days to keep your application moving. Never include your full Social Security number or card details in an email reply.",
    textFooter({ reference: ctx.reference }),
  ].join("\n");

  return {
    subject,
    html: emailShell({
      preheader,
      bodyHtml,
      banner: { tone: "warning", text: "We need one more detail" },
      footerReference: ctx.reference,
      campaign: "missing_info",
    }),
    text,
  };
}

export async function sendMissingInfoEmail(
  ctx: LifecycleCtx,
  ask: string,
  opts?: { force?: boolean },
): Promise<SendEmailResult> {
  const tpl = buildMissingInfoEmail(ctx, ask);
  return sendEmail({
    applicationId: ctx.applicationId,
    type: "missing_info",
    to: ctx.email,
    from: FROM.applications(),
    replyTo: replyTo(),
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    force: opts?.force,
    meta: { askLength: ask.length },
  });
}

/* ------------------------------------------------------------------ */
/* EMAIL #10 — Refund Confirmation                                     */
/* ------------------------------------------------------------------ */

export interface RefundEmailInput {
  refundTransactionId: string;
  refundedAt: Date;
  cardBrand?: string | null;
  cardLast4?: string | null;
  /** Refunded amount in dollars (full refund when equal to ctx.amount). */
  amount: number;
}

export function buildRefundEmail(ctx: LifecycleCtx, input: RefundEmailInput): BuiltEmail {
  const applicant = applicantSection(ctx);
  const subject = `Your refund of ${formatPrice(input.amount)} has been issued (${ctx.reference})`;
  const preheader = "Allow 5–10 business days for it to appear on your statement.";
  const method = [input.cardBrand, input.cardLast4 ? `ending ${input.cardLast4}` : ""]
    .filter(Boolean)
    .join(" ");

  const rows = [
    detailRow("Date", esc(fmtDateTimeET(input.refundedAt))),
    detailRow("Refund amount", esc(formatPrice(input.amount)), { strong: true }),
    method ? detailRow("Refunded to", esc(method)) : "",
    detailRow("Refund transaction ID", esc(input.refundTransactionId), { mono: true }),
    detailRow("Reference", esc(ctx.reference), { mono: true }),
  ].join("");

  const bodyHtml = `
    <h1 style="margin:0 0 14px;font-size:23px;line-height:1.3;font-weight:700;color:#0A2540;">Refund issued</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#475569;">Hi ${esc(greetingName(ctx))},</p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">
      Your refund has been issued in full${method ? ` to your ${esc(method)}` : ""}. Depending on
      your bank, it typically appears on your statement within
      <strong style="color:#0A2540;">5–10 business days</strong>.
    </p>
    ${detailCard(rows, { heading: "Refund details" })}
    ${applicant.html}
    <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#64748B;">
      The original charge appeared on your statement as
      <strong style="color:#0A2540;">${esc(NMI_DESCRIPTOR)}</strong>; the refund will reference
      the same descriptor. If it hasn't arrived after 10 business days, just reply and we'll
      chase it with the processor.
    </p>
    <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#475569;">
      We're sorry this application didn't work out — we'd love to help with a future license
      whenever you're ready.
    </p>`;

  const text = [
    `Hi ${greetingName(ctx)},`,
    "",
    `Your refund has been issued in full${method ? ` to your ${method}` : ""}. Depending on your bank, it typically appears on your statement within 5–10 business days.`,
    "",
    "REFUND DETAILS",
    `Date: ${fmtDateTimeET(input.refundedAt)}`,
    `Refund amount: ${formatPrice(input.amount)}`,
    ...(method ? [`Refunded to: ${method}`] : []),
    `Refund transaction ID: ${input.refundTransactionId}`,
    `Reference: ${ctx.reference}`,
    "",
    ...applicant.textLines,
    ...(applicant.textLines.length ? [""] : []),
    `The original charge appeared as ${NMI_DESCRIPTOR}; the refund references the same descriptor. If it hasn't arrived after 10 business days, just reply and we'll chase it with the processor.`,
    "",
    "We're sorry this application didn't work out — we'd love to help with a future license whenever you're ready.",
    textFooter({ reference: ctx.reference }),
  ].join("\n");

  return {
    subject,
    html: emailShell({
      preheader,
      bodyHtml,
      banner: { tone: "success", text: "Refund issued" },
      footerReference: ctx.reference,
      campaign: "refund_confirmation",
    }),
    text,
  };
}

export async function sendRefundEmail(
  ctx: LifecycleCtx,
  input: RefundEmailInput,
): Promise<SendEmailResult> {
  const tpl = buildRefundEmail(ctx, input);
  return sendEmail({
    applicationId: ctx.applicationId,
    type: "refund_confirmation",
    to: ctx.email,
    from: FROM.receipts(),
    replyTo: replyTo(),
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    meta: { refundTransactionId: input.refundTransactionId, amount: input.amount },
  });
}

/* ------------------------------------------------------------------ */
/* Renewal reminder (14 days before license expiry)                    */
/* ------------------------------------------------------------------ */

export function buildRenewalReminderEmail(
  ctx: LifecycleCtx,
  input: { validTo: string; optOutUrl: string },
): BuiltEmail {
  const state = stateName(ctx);
  const applicant = applicantSection(ctx);
  const subject = `Your ${state} fishing license expires soon (${ctx.reference})`;
  const preheader = `It expires ${fmtDateOnly(input.validTo)} — renew in about 2 minutes so there's no gap.`;
  const renewUrl = utmLink(`/${ctx.stateSlug}`, "renewal_reminder");

  const bodyHtml = `
    <h1 style="margin:0 0 14px;font-size:23px;line-height:1.3;font-weight:700;color:#0A2540;">Time to renew?</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#475569;">Hi ${esc(greetingName(ctx))},</p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">
      A friendly heads-up: your ${esc(state)} fishing license expires on
      <strong style="color:#0A2540;">${esc(fmtDateOnly(input.validTo))}</strong>. If you're
      planning to keep fishing, renewing takes about 2 minutes — and our team handles the rest,
      same as last time.
    </p>
    ${ctaButton(renewUrl, `Renew your ${state} license`)}
    ${applicant.html}
    <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#64748B;">
      Not planning to renew? No action needed — this is just a heads-up, and nothing is charged.
    </p>`;

  const text = [
    `Hi ${greetingName(ctx)},`,
    "",
    `A friendly heads-up: your ${state} fishing license expires on ${fmtDateOnly(input.validTo)}. If you're planning to keep fishing, renewing takes about 2 minutes — and our team handles the rest, same as last time.`,
    "",
    `Renew your ${state} license:`,
    renewUrl,
    "",
    ...applicant.textLines,
    ...(applicant.textLines.length ? [""] : []),
    "Not planning to renew? No action needed — this is just a heads-up, and nothing is charged.",
    "",
    `Stop renewal reminders: ${input.optOutUrl}`,
    textFooter({ reference: ctx.reference }),
  ].join("\n");

  return {
    subject,
    html: emailShell({
      preheader,
      bodyHtml: `${bodyHtml}
    <p style="margin:14px 0 0;font-size:12px;color:#64748B;"><a href="${esc(input.optOutUrl)}" style="color:#64748B;text-decoration:underline;">Stop renewal reminders</a></p>`,
      banner: { tone: "info", text: "License renewal reminder" },
      footerReference: ctx.reference,
      campaign: "renewal_reminder",
    }),
    text,
  };
}

export async function sendRenewalReminderEmail(
  ctx: LifecycleCtx,
  input: { validTo: string; optOutUrl: string },
): Promise<SendEmailResult> {
  const tpl = buildRenewalReminderEmail(ctx, input);
  const oneClick = `${input.optOutUrl}${input.optOutUrl.includes("?") ? "&" : "?"}one_click=1`;
  return sendEmail({
    applicationId: ctx.applicationId,
    type: "renewal_reminder",
    to: ctx.email,
    from: FROM.applications(),
    replyTo: replyTo(),
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    headers: {
      "List-Unsubscribe": `<${oneClick}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    meta: { validTo: input.validTo },
  });
}
