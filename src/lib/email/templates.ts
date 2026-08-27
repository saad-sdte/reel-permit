import type { StateConfig } from "@/lib/state-config";
import { computeOrderTotal, formatLicenseDateRange } from "@/lib/state-config";
import { formatPrice } from "@/lib/format";
import type { StoredApplication } from "@/lib/storage";
import {
  BRAND,
  detailCard,
  detailRow,
  emailShell,
  esc,
  referenceBanner,
  siteUrl,
  stepsBlock,
  textFooter,
} from "./email-layout";
import { buildApplicantDetails } from "./applicant-details";

/* ------------------------------------------------------------------ */
/* shared helpers                                                      */
/* ------------------------------------------------------------------ */

export interface OrderEmailContext {
  config: StateConfig | null;
  app: StoredApplication;
  /** Applicant data with SSN fields masked (***-**-####). */
  maskedData: Record<string, unknown>;
  /**
   * Raw applicant data. Used ONLY when ADMIN_EMAIL_INCLUDE_FULL_SSN=true to
   * include the unmasked SSN in the admin fulfillment email. Never sent to
   * customers and never logged.
   */
  rawData?: Record<string, unknown>;
}

function residencyLabel(value: string): string {
  switch (value) {
    case "resident": return "Resident";
    case "nonresident": return "Non-resident";
    case "senior": return "Senior";
    case "youth": return "Youth";
    default: return value ? value.charAt(0).toUpperCase() + value.slice(1) : "—";
  }
}

function licenseName(ctx: OrderEmailContext): string {
  return (
    ctx.config?.licenses.find((l) => l.id === ctx.app.licenseId)?.name ?? ctx.app.licenseId
  );
}

/**
 * Human-readable validity range for a short-term license (e.g.
 * "Aug 4, 2026 – Aug 6, 2026 (3 days)"), pulled from the applicant's
 * chosen `licenseStartDate` and the SKU's duration. Returns null when
 * the license is annual/lifetime or the applicant didn't pick a date.
 */
function licenseValidity(ctx: OrderEmailContext): string | null {
  const sku = ctx.config?.licenses.find((l) => l.id === ctx.app.licenseId);
  if (!sku) return null;
  return formatLicenseDateRange(ctx.maskedData["licenseStartDate"], sku.duration);
}

function addOnNames(ctx: OrderEmailContext): string[] {
  return ctx.app.addOnIds.map(
    (id) => ctx.config?.addOns.find((a) => a.id === id)?.name ?? id,
  );
}

function stateName(ctx: OrderEmailContext): string {
  return ctx.config?.stateName ?? ctx.app.stateSlug;
}

function orderTotal(ctx: OrderEmailContext): number {
  // Prefer the actual charged/stored amount so promo codes and overrides match
  // what the gateway charged and what the customer receipt shows. Fall back to
  // catalog pricing only when no payment amount is available yet (e.g. checkout started).
  if (typeof ctx.app.payment?.amount === "number") {
    return ctx.app.payment.amount;
  }
  return ctx.config
    ? computeOrderTotal(ctx.config, ctx.app.licenseId, ctx.app.addOnIds)
    : 0;
}

function customerFirstName(ctx: OrderEmailContext): string {
  const v = ctx.maskedData["firstName"];
  return typeof v === "string" && v.trim() ? v.trim() : "";
}

/** The customer's email address as submitted on the application. */
export function customerEmail(ctx: OrderEmailContext): string | null {
  const v = ctx.maskedData["email"];
  return typeof v === "string" && /.+@.+\..+/.test(v) ? v.trim() : null;
}

function paymentSummaryValue(app: StoredApplication): string {
  const card = app.payment.last4
    ? `${app.payment.brand ?? "Card"} •••• ${app.payment.last4}`
    : "Card";
  return `${card}`;
}

function formatValue(value: unknown): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

/** Pretty-print an ISO / MM-DD-YYYY date field for admin email display. */
function formatDateValue(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "—";
  const s = value.trim();
  let d: Date | null = null;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    d = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
  } else {
    const us = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (us) {
      d = new Date(Date.UTC(Number(us[3]), Number(us[1]) - 1, Number(us[2])));
    }
  }
  if (!d || Number.isNaN(d.getTime())) return s;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/* ------------------------------------------------------------------ */
/* 1. customer order confirmation                                      */
/* ------------------------------------------------------------------ */

export function orderConfirmationEmail(ctx: OrderEmailContext): {
  subject: string;
  html: string;
  text: string;
} {
  const first = customerFirstName(ctx);
  const state = stateName(ctx);
  const total = formatPrice(orderTotal(ctx));
  const addOns = addOnNames(ctx);
  const subject = `ReelPermit filed your ${state} application — ${ctx.app.reference}`;

  const applicant = buildApplicantDetails(ctx.config, ctx.maskedData);
  const validity = licenseValidity(ctx);
  const orderRows = [
    detailRow("State", esc(state)),
    detailRow("Residency", esc(residencyLabel(ctx.app.residency))),
    detailRow("License", esc(licenseName(ctx))),
    ...(validity ? [detailRow("Valid", esc(validity))] : []),
    ...(addOns.length ? [detailRow("Add-ons", esc(addOns.join(", ")))] : []),
    detailRow("Submitted", esc(new Date(ctx.app.submittedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" }) + " CT")),
  ].join("");

  const paymentRows = [
    detailRow("Amount charged", esc(total), { strong: true }),
    detailRow("Payment method", esc(paymentSummaryValue(ctx.app))),
    detailRow("Transaction ID", esc(ctx.app.payment.transactionId), { mono: true }),
    detailRow("Statement descriptor", esc(ctx.app.payment.descriptor)),
  ].join("");

  const bodyHtml = `
    <h1 style="margin:0;font-size:22px;line-height:1.3;color:${BRAND.navy};">Michigan desk has your file${first ? `, ${esc(first)}` : ""}.</h1>
    <p style="margin:14px 0 0;font-size:14px;line-height:1.65;color:${BRAND.slate600};">
      Payment of <strong style="color:${BRAND.navy};">${esc(total)}</strong> is in. ReelPermit will review this
      <strong style="color:${BRAND.navy};">${esc(state)}</strong> fishing-license file and submit it on the official MDNR portal — we do not issue licenses ourselves.
    </p>
    ${referenceBanner(ctx.app.reference)}
    ${detailCard(orderRows, { heading: "What you ordered" })}
    ${detailCard(paymentRows, { heading: "Charge" })}
    ${applicant.html}
    <h2 style="margin:26px 0 0;font-size:16px;color:${BRAND.navy};">On our side next</h2>
    ${stepsBlock([
      { title: "Desk review", body: "Someone checks the file against MDNR rules — usually within one business day." },
      { title: "Official purchase", body: "We buy the license on Michigan’s eLicense portal. Your statement shows “" + ctx.app.payment.descriptor + "”." },
      { title: "PDF to this inbox", body: "When MDNR issues the document, we email it here as an attachment." },
    ])}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;border-left:3px solid ${BRAND.gold};background:${BRAND.navy50};border-radius:0 4px 4px 0;">
      <tr><td style="padding:13px 18px;">
        <p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.forest};">
          <strong>Refunds:</strong> full refund until we complete the MDNR purchase. After that, state rules apply.
        </p>
      </td></tr>
    </table>`;

  const text = [
    `Michigan desk has your file${first ? `, ${first}` : ""}.`,
    ``,
    `Payment of ${total} is in. ReelPermit will review this ${state} fishing-license file and submit it on the official MDNR portal — we do not issue licenses ourselves.`,
    ``,
    `File number: ${ctx.app.reference}`,
    `(Quote this number if you write to support.)`,
    ``,
    `WHAT YOU ORDERED`,
    `State: ${state}`,
    `Residency: ${residencyLabel(ctx.app.residency)}`,
    `License: ${licenseName(ctx)}`,
    ...(validity ? [`Valid: ${validity}`] : []),
    ...(addOns.length ? [`Add-ons: ${addOns.join(", ")}`] : []),
    ``,
    `CHARGE`,
    `Amount charged: ${total}`,
    `Payment method: ${paymentSummaryValue(ctx.app)}`,
    `Transaction ID: ${ctx.app.payment.transactionId}`,
    `Statement descriptor: ${ctx.app.payment.descriptor}`,
    ``,
    ...applicant.textLines,
    ...(applicant.textLines.length ? [``] : []),
    `ON OUR SIDE NEXT`,
    `1. Desk review — usually within one business day.`,
    `2. Official purchase on Michigan’s eLicense portal.`,
    `3. PDF emailed here when MDNR issues it.`,
    ``,
    `Refunds: full refund until we complete the MDNR purchase. After that, state rules apply.`,
    textFooter(),
  ].join("\n");

  return { subject, html: emailShell({ preheader: `File ${ctx.app.reference} · ${state} · ${total} — MDNR PDF follows after we purchase.`, kicker: "File received", bodyHtml }), text };
}

/* ------------------------------------------------------------------ */
/* 2. admin new-order notification                                     */
/* ------------------------------------------------------------------ */

export function adminNewOrderEmail(
  ctx: OrderEmailContext,
  opts: { includeFullSSN: boolean; stage?: "paid" | "checkout_started" },
): { subject: string; html: string; text: string } {
  const stage = opts.stage ?? "paid";
  const checkoutStarted = stage === "checkout_started";
  const state = stateName(ctx);
  const total = formatPrice(orderTotal(ctx));
  const addOns = addOnNames(ctx);
  // Ops subjects stay emoji-free so they sort cleanly next to AnglerPermit inboxes.
  const subject = checkoutStarted
    ? `[RP] Checkout open ${ctx.app.reference} — ${state} — ${total}`
    : `[RP] Paid ${ctx.app.reference} — ${state} — ${total}`;

  // Choose data source: masked by default; raw only when explicitly enabled.
  const data =
    opts.includeFullSSN && ctx.rawData ? ctx.rawData : ctx.maskedData;

  // Render applicant fields in the order defined by the state config, with
  // official labels; append any extra keys not covered by the config.
  const rendered = new Set<string>();
  const applicantRows: string[] = [];
  const applicantText: string[] = [];
  if (ctx.config) {
    for (const field of ctx.config.formFields) {
      if (!(field.name in data)) continue;
      rendered.add(field.name);
      const raw = data[field.name];
      let value: string;
      if (field.type === "date") {
        value = formatDateValue(raw);
      } else if ((field.type === "select" || field.type === "radio") && typeof raw === "string") {
        value = field.options?.find((o) => o.value === raw)?.label ?? formatValue(raw);
      } else {
        value = formatValue(raw);
      }
      applicantRows.push(detailRow(field.label, esc(value)));
      applicantText.push(`${field.label}: ${value}`);
    }
  }
  for (const [key, value] of Object.entries(data)) {
    if (rendered.has(key)) continue;
    const v = formatValue(value);
    applicantRows.push(detailRow(key, esc(v)));
    applicantText.push(`${key}: ${v}`);
  }

  const ssnNote = opts.includeFullSSN
    ? `<p style="margin:10px 0 0;font-size:12px;color:${BRAND.red600};font-weight:600;">Contains full SSN — handle per your data-handling policy and delete when fulfilled.</p>`
    : `<p style="margin:10px 0 0;font-size:12px;color:${BRAND.slate500};">SSN fields are masked (***-**-last4). Set ADMIN_EMAIL_INCLUDE_FULL_SSN=true only if your fulfillment flow requires the full number by email.</p>`;

  const validity = licenseValidity(ctx);
  const orderRows = [
    detailRow("Reference", esc(ctx.app.reference), { mono: true, strong: true }),
    detailRow("State", esc(state)),
    detailRow("Residency", esc(residencyLabel(ctx.app.residency))),
    detailRow("License", esc(licenseName(ctx))),
    ...(validity ? [detailRow("Valid", esc(validity))] : []),
    ...(addOns.length ? [detailRow("Add-ons", esc(addOns.join(", ")))] : []),
    detailRow("Started", esc(ctx.app.submittedAt), { mono: true }),
  ].join("");

  const paymentRows = checkoutStarted
    ? [
        detailRow("Amount due", esc(total), { strong: true }),
        detailRow("Payment status", "Pending — customer is on the payment step"),
      ].join("")
    : [
        detailRow("Amount charged", esc(total), { strong: true }),
        detailRow("Card", esc(paymentSummaryValue(ctx.app))),
        detailRow("Transaction ID", esc(ctx.app.payment.transactionId), { mono: true }),
        ...(ctx.app.payment.devMode
          ? [detailRow("Mode", `<span style="color:${BRAND.red600};font-weight:700;">DEV — SIMULATED CHARGE</span>`)]
          : []),
      ].join("");

  const portal = ctx.config
    ? `<p style="margin:18px 0 0;font-size:13px;color:${BRAND.slate600};">Fulfill at: <a href="${esc(ctx.config.officialPortalUrl)}" style="color:${BRAND.forest500};font-weight:600;">${esc(ctx.config.officialPortalName)}</a></p>`
    : "";

  const bodyHtml = `
    <h1 style="margin:0;font-size:20px;color:${BRAND.navy};">${checkoutStarted ? "Checkout open — not paid yet" : "Payment captured"}</h1>
    <p style="margin:10px 0 0;font-size:14px;color:${BRAND.slate600};">${
      checkoutStarted
        ? "Applicant finished the form and opened payment. Reply to reach them if they abandon checkout."
        : "Payment cleared — reply to this email to reach the customer directly."
    }</p>
    ${detailCard(orderRows, { heading: "Order" })}
    ${detailCard(paymentRows, { heading: "Payment" })}
    ${detailCard(applicantRows.join(""), { heading: "Applicant details (as submitted)" })}
    ${ssnNote}
    ${portal}`;

  const text = [
    checkoutStarted ? `Checkout open — not paid yet` : `Payment captured`,
    ``,
    `ORDER`,
    `Reference: ${ctx.app.reference}`,
    `State: ${state}`,
    `Residency: ${residencyLabel(ctx.app.residency)}`,
    `License: ${licenseName(ctx)}`,
    ...(validity ? [`Valid: ${validity}`] : []),
    ...(addOns.length ? [`Add-ons: ${addOns.join(", ")}`] : []),
    `Started: ${ctx.app.submittedAt}`,
    ``,
    `PAYMENT`,
    ...(checkoutStarted
      ? [`Amount due: ${total}`, `Payment status: Pending — customer is on the payment step`]
      : [
          `Amount charged: ${total}`,
          `Card: ${paymentSummaryValue(ctx.app)}`,
          `Transaction ID: ${ctx.app.payment.transactionId}`,
          ...(ctx.app.payment.devMode ? [`Mode: DEV — SIMULATED CHARGE`] : []),
        ]),
    ``,
    `APPLICANT DETAILS (as submitted)`,
    ...applicantText,
    ``,
    opts.includeFullSSN
      ? `NOTE: contains full SSN — handle per policy and delete when fulfilled.`
      : `NOTE: SSN fields are masked (***-**-last4).`,
    ...(ctx.config ? [``, `Fulfill at: ${ctx.config.officialPortalName} — ${ctx.config.officialPortalUrl}`] : []),
  ].join("\n");

  return {
    subject,
    html: emailShell({
      preheader: `${state} · ${licenseName(ctx)} · ${total}`,
      kicker: checkoutStarted ? "Checkout started" : "Payment received",
      bodyHtml,
    }),
    text,
  };
}

/** Customer email when they finish the form and reach the payment step. */
export function checkoutStartedCustomerEmail(ctx: OrderEmailContext): {
  subject: string;
  html: string;
  text: string;
} {
  const first = customerFirstName(ctx);
  const state = stateName(ctx);
  const total = formatPrice(orderTotal(ctx));
  const addOns = addOnNames(ctx);
  const subject = `Finish Michigan checkout — ${ctx.app.reference}`;

  const applicant = buildApplicantDetails(ctx.config, ctx.maskedData);
  const validity = licenseValidity(ctx);
  const orderRows = [
    detailRow("Reference", esc(ctx.app.reference), { mono: true, strong: true }),
    detailRow("State", esc(state)),
    detailRow("Residency", esc(residencyLabel(ctx.app.residency))),
    detailRow("License", esc(licenseName(ctx))),
    ...(validity ? [detailRow("Valid", esc(validity))] : []),
    ...(addOns.length ? [detailRow("Add-ons", esc(addOns.join(", ")))] : []),
    detailRow("Amount due", esc(total), { strong: true }),
  ].join("");

  const bodyHtml = `
    <h1 style="margin:0;font-size:22px;line-height:1.3;color:${BRAND.navy};">Payment is still open${first ? `, ${esc(first)}` : ""}</h1>
    <p style="margin:14px 0 0;font-size:14px;line-height:1.65;color:${BRAND.slate600};">
      We stored your <strong style="color:${BRAND.navy};">${esc(state)}</strong> details. Nothing is charged until you complete the card step.
    </p>
    ${referenceBanner(ctx.app.reference)}
    ${detailCard(orderRows, { heading: "Saved file" })}
    ${applicant.html}
    <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:${BRAND.slate600};">
      Go back to the payment page in your browser to pay <strong>${esc(total)}</strong>.
      If that tab is gone, start again from reelpermit.com/apply — the desk will pick up the file once it is paid.
    </p>`;

  const text = [
    `Payment is still open${first ? `, ${first}` : ""}.`,
    ``,
    `We stored your ${state} details. Nothing is charged until you complete the card step.`,
    ``,
    `Reference: ${ctx.app.reference}`,
    `State: ${state}`,
    `Residency: ${residencyLabel(ctx.app.residency)}`,
    `License: ${licenseName(ctx)}`,
    ...(validity ? [`Valid: ${validity}`] : []),
    ...(addOns.length ? [`Add-ons: ${addOns.join(", ")}`] : []),
    `Amount due: ${total}`,
    ``,
    ...applicant.textLines,
    ...(applicant.textLines.length ? [``] : []),
    `Return to the payment step in your browser to complete your order.`,
    textFooter(),
  ].join("\n");

  return {
    subject,
    html: emailShell({
      preheader: `Complete payment for your ${state} license · ${total}`,
      kicker: "Checkout",
      bodyHtml,
    }),
    text,
  };
}

/* ------------------------------------------------------------------ */
/* 3. contact form — admin notification                                */
/* ------------------------------------------------------------------ */

export interface ContactMessage {
  name: string;
  email: string;
  reference?: string;
  message: string;
}

export function contactNotificationEmail(msg: ContactMessage): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `ReelPermit contact form — ${msg.name}${msg.reference ? ` — ${msg.reference}` : ""}`;
  const rows = [
    detailRow("Name", esc(msg.name)),
    detailRow("Email", `<a href="mailto:${esc(msg.email)}" style="color:${BRAND.forest500};">${esc(msg.email)}</a>`),
    ...(msg.reference ? [detailRow("Reference", esc(msg.reference), { mono: true })] : []),
  ].join("");

  const bodyHtml = `
    <h1 style="margin:0;font-size:20px;color:${BRAND.navy};">Inbox note from the site</h1>
    <p style="margin:10px 0 0;font-size:14px;color:${BRAND.slate600};">Submitted on reelpermit.com. Reply to this email to answer ${esc(msg.name.split(" ")[0] || "them")} directly.</p>
    ${detailCard(rows, { heading: "From" })}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;border:1px solid ${BRAND.slate200};border-radius:12px;">
      <tr><td style="padding:18px 22px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.slate500};">Message</p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:${BRAND.navy};white-space:pre-wrap;">${esc(msg.message)}</p>
      </td></tr>
    </table>`;

  const text = [
    `Inbox note from the site (contact form)`,
    ``,
    `Name: ${msg.name}`,
    `Email: ${msg.email}`,
    ...(msg.reference ? [`Reference: ${msg.reference}`] : []),
    ``,
    `MESSAGE`,
    msg.message,
  ].join("\n");

  return {
    subject,
    html: emailShell({ preheader: msg.message.slice(0, 120), kicker: "Support", bodyHtml }),
    text,
  };
}

/* ------------------------------------------------------------------ */
/* 4. contact form — customer acknowledgement                          */
/* ------------------------------------------------------------------ */

export function contactAckEmail(msg: ContactMessage): {
  subject: string;
  html: string;
  text: string;
} {
  const first = msg.name.trim().split(/\s+/)[0] || "";
  const subject = `ReelPermit Support has your note${msg.reference ? ` — ${msg.reference}` : ""}`;

  const bodyHtml = `
    <h1 style="margin:0;font-size:22px;color:${BRAND.navy};">It's on the Michigan desk${first ? `, ${esc(first)}` : ""}.</h1>
    <p style="margin:14px 0 0;font-size:14px;line-height:1.65;color:${BRAND.slate600};">
      Someone here will read this and reply, typically within
      <strong style="color:${BRAND.navy};">one business day</strong>${msg.reference ? `. We tied it to file <strong style="color:${BRAND.navy};font-family:monospace;">${esc(msg.reference)}</strong>` : ""}.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;border:1px solid ${BRAND.slate200};border-radius:4px;background:${BRAND.slate50};">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.slate500};">What you sent</p>
        <p style="margin:0;font-size:13px;line-height:1.65;color:${BRAND.slate600};white-space:pre-wrap;">${esc(msg.message)}</p>
      </td></tr>
    </table>
    <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:${BRAND.slate600};">
      For common Michigan license questions, see the <a href="${siteUrl()}/faq" style="color:${BRAND.forest500};font-weight:600;">FAQ</a>.
    </p>`;

  const text = [
    `It's on the Michigan desk${first ? `, ${first}` : ""}.`,
    ``,
    `Someone here will read this and reply, typically within one business day.${msg.reference ? ` Tied to file ${msg.reference}.` : ""}`,
    ``,
    `WHAT YOU SENT`,
    msg.message,
    ``,
    `FAQ: ${siteUrl()}/faq`,
    textFooter(),
  ].join("\n");

  return {
    subject,
    html: emailShell({ preheader: "The Michigan desk has your note — typical reply is one business day.", kicker: "Support", bodyHtml }),
    text,
  };
}

/* ------------------------------------------------------------------ */
/* 5. license delivery                                                 */
/* ------------------------------------------------------------------ */

export interface LicenseDeliveryInput {
  customerName: string;
  reference: string;
  stateName: string;
  /** Optional personal note from the team, shown above the standard copy. */
  note?: string;
  attachmentNames: string[];
}

export function licenseDeliveryEmail(input: LicenseDeliveryInput): {
  subject: string;
  html: string;
  text: string;
} {
  const first = input.customerName.trim().split(/\s+/)[0] || "";
  const subject = `Michigan license PDF — ${input.reference}`;

  const noteHtml = input.note
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;border-left:3px solid ${BRAND.forest500};background:${BRAND.forest50};border-radius:0 10px 10px 0;">
        <tr><td style="padding:13px 18px;">
          <p style="margin:0;font-size:13px;line-height:1.65;color:${BRAND.forest};white-space:pre-wrap;">${esc(input.note)}</p>
        </td></tr>
      </table>`
    : "";

  const attachList = input.attachmentNames.length
    ? `<ul style="margin:8px 0 0;padding-left:20px;">${input.attachmentNames
        .map((n) => `<li style="font-size:13px;color:${BRAND.navy};font-weight:600;margin:3px 0;">${esc(n)}</li>`)
        .join("")}</ul>`
    : "";

  const bodyHtml = `
    <h1 style="margin:0;font-size:22px;color:${BRAND.navy};">Official MDNR document attached${first ? `, ${esc(first)}` : ""}.</h1>
    <p style="margin:14px 0 0;font-size:14px;line-height:1.65;color:${BRAND.slate600};">
      ReelPermit purchased this <strong style="color:${BRAND.navy};">${esc(input.stateName)}</strong> fishing license on the state portal. The PDF is on this email.
      Save it or print it, carry it on the water, and follow Michigan regulations.
    </p>
    ${referenceBanner(input.reference)}
    ${noteHtml}
    <p style="margin:20px 0 0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.slate500};">Attached</p>
    ${attachList}
    <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:${BRAND.slate600};">
      Check the license carefully. If anything looks wrong, reply to this email with your reference number and we'll make it right.
    </p>`;

  const text = [
    `Official MDNR document attached${first ? `, ${first}` : ""}.`,
    ``,
    `ReelPermit purchased this ${input.stateName} fishing license on the state portal. The PDF is on this email.`,
    ``,
    `Reference: ${input.reference}`,
    ``,
    ...(input.note ? [input.note, ``] : []),
    `Attached: ${input.attachmentNames.join(", ") || "license document"}`,
    ``,
    `Save it or print it, carry it on the water, and follow Michigan regulations.`,
    `If anything looks wrong, reply to this email with your reference number and we'll make it right.`,
    textFooter(),
  ].join("\n");

  return {
    subject,
    html: emailShell({ preheader: `MDNR license PDF attached — file ${input.reference}.`, kicker: "License PDF", bodyHtml }),
    text,
  };
}
