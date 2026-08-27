/**
 * Shared email layout — brand shell used by every ReelPermit email.
 *
 * Email HTML rules applied throughout:
 * - table-based layout, all styles inline (Gmail strips <style> in some views)
 * - system font stack (webfonts are unreliable in email clients)
 * - max width 600px, single column, generous whitespace
 * - brand palette mirrors tailwind.config.ts: navy #0A2540, forest #1B4332,
 *   forest-500 #2D6A4F accents, slate text
 * - every template also ships a plain-text alternative (built in templates.ts)
 */

export const BRAND = {
  navy: "#0A2540",
  navyLight: "#122F4E",
  navy50: "#F0F5FA",
  navy100: "#DCE7F2",
  forest: "#1B4332",
  forest500: "#2D6A4F",
  forest50: "#F0F7F4",
  slate600: "#475569",
  slate500: "#64748B",
  slate200: "#E2E8F0",
  slate50: "#F8FAFC",
  white: "#FFFFFF",
  red600: "#DC2626",
} as const;

export const FONT_STACK =
  "'Inter','Segoe UI',system-ui,-apple-system,'Helvetica Neue',Arial,sans-serif";

/** Business identity + support contact shown in every footer. */
export const BUSINESS = {
  legalName: process.env.BUSINESS_LEGAL_NAME ?? "ReelPermit",
  address: process.env.BUSINESS_ADDRESS ?? "5900 Balcones Dr Ste 100, Austin, TX 78731",
  supportEmail: process.env.SUPPORT_EMAIL ?? "support@reelpermit.local",
  supportPhone: process.env.SUPPORT_PHONE ?? "",
} as const;

/** Status-banner tones — the 2-second scan line under the header. */
export const TONES = {
  info: { fg: "#175CD3", bg: "#EFF8FF", glyph: "ℹ" },
  success: { fg: "#067647", bg: "#ECFDF3", glyph: "✓" },
  warning: { fg: "#B54708", bg: "#FFFAEB", glyph: "!" },
  error: { fg: "#B42318", bg: "#FEF3F2", glyph: "!" },
} as const;

export type Tone = keyof typeof TONES;

/** Append transactional UTM parameters to a site link. */
export function utmLink(pathOrUrl: string, campaign: string): string {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${siteUrl()}${pathOrUrl}`;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}utm_source=transactional&utm_medium=email&utm_campaign=${encodeURIComponent(campaign)}`;
}

/**
 * Full-width tinted status strip shown directly under the navy header.
 * One line, glyph + short status — readable in 2 seconds.
 */
export function statusBanner(tone: Tone, text: string): string {
  const t = TONES[tone];
  return `
    <tr><td style="background:${t.bg};padding:12px 34px;border:1px solid ${BRAND.slate200};border-top:0;border-bottom:0;">
      <p style="margin:0;font-size:14px;font-weight:700;color:${t.fg};">
        <span style="display:inline-block;width:18px;height:18px;line-height:18px;border-radius:50%;background:${t.fg};color:#FFFFFF;text-align:center;font-size:12px;margin-right:8px;vertical-align:-2px;">${t.glyph}</span>${esc(text)}
      </p>
    </td></tr>`;
}

/**
 * Bulletproof primary CTA button (navy, 48px tap target) with a VML
 * fallback so Outlook on Windows renders it correctly.
 */
export function ctaButton(href: string, label: string): string {
  const safeHref = esc(href);
  const safeLabel = esc(label);
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;"><tr><td align="center">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeHref}" style="height:48px;v-text-anchor:middle;width:320px;" arcsize="17%" fillcolor="${BRAND.navy}" stroke="f">
        <w:anchorlock/>
        <center style="color:#FFFFFF;font-family:sans-serif;font-size:16px;font-weight:600;">${safeLabel}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${safeHref}" style="display:inline-block;min-width:220px;padding:14px 36px;border-radius:8px;background:${BRAND.navy};color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;text-align:center;line-height:20px;">${safeLabel}</a>
      <!--<![endif]-->
    </td></tr></table>`;
}

/** Escape a value for safe interpolation into HTML. */
export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** A key/value row inside a details table. */
export function detailRow(label: string, value: string, opts?: { mono?: boolean; strong?: boolean }): string {
  const mono = opts?.mono ? `font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;letter-spacing:0.02em;` : "";
  const weight = opts?.strong ? "700" : "500";
  // Label column is capped (long official labels wrap) so the value column
  // always keeps room — never use nowrap here or values collapse to 1ch.
  const shortLabel = label.length > 90 ? `${label.slice(0, 87)}…` : label;
  return `
    <tr>
      <td style="padding:7px 24px 7px 0;font-size:13px;line-height:1.5;color:${BRAND.slate500};vertical-align:top;width:44%;">${esc(shortLabel)}</td>
      <td style="padding:7px 0;font-size:14px;line-height:1.5;color:${BRAND.navy};font-weight:${weight};${mono}text-align:right;vertical-align:top;overflow-wrap:anywhere;">${value}</td>
    </tr>`;
}

/** A bordered card section holding detail rows. */
export function detailCard(rowsHtml: string, opts?: { heading?: string }): string {
  const heading = opts?.heading
    ? `<p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.slate500};">${esc(opts.heading)}</p>`
    : "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;border:1px solid ${BRAND.slate200};border-radius:12px;background:${BRAND.slate50};">
      <tr><td style="padding:18px 22px;">
        ${heading}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
      </td></tr>
    </table>`;
}

/** Prominent reference-number banner. */
export function referenceBanner(reference: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0;border:1px solid ${BRAND.navy100};border-radius:12px;background:${BRAND.navy50};">
      <tr><td align="center" style="padding:16px 22px;">
        <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND.slate500};">Your reference number</p>
        <p style="margin:6px 0 0;font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;font-size:20px;font-weight:700;color:${BRAND.navy};letter-spacing:0.03em;">${esc(reference)}</p>
        <p style="margin:6px 0 0;font-size:12px;color:${BRAND.slate500};">Keep this number — include it whenever you contact us.</p>
      </td></tr>
    </table>`;
}

/** Numbered "what happens next" steps. */
export function stepsBlock(steps: Array<{ title: string; body: string }>): string {
  const items = steps
    .map(
      (s, i) => `
      <tr>
        <td style="vertical-align:top;padding:8px 14px 8px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td align="center" style="width:26px;height:26px;border-radius:50%;background:${BRAND.navy};color:${BRAND.white};font-size:13px;font-weight:700;line-height:26px;">${i + 1}</td>
          </tr></table>
        </td>
        <td style="vertical-align:top;padding:8px 0;">
          <p style="margin:0;font-size:14px;font-weight:600;color:${BRAND.navy};">${esc(s.title)}</p>
          <p style="margin:2px 0 0;font-size:13px;line-height:1.55;color:${BRAND.slate600};">${esc(s.body)}</p>
        </td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0 0;">${items}</table>`;
}

export interface ShellOptions {
  /** Preheader — the preview snippet inbox clients show next to the subject. */
  preheader: string;
  /** Main body HTML (inside the white card). */
  bodyHtml: string;
  /** Optional badge text shown in the navy header, e.g. "Order confirmation". */
  kicker?: string;
  /** Optional status banner (tinted strip under the navy header). */
  banner?: { tone: Tone; text: string };
  /** Reference number repeated small in the footer. */
  footerReference?: string;
  /** "Pause payment reminders" link — dunning emails #5–#7 ONLY. */
  pauseUrl?: string;
  /** UTM campaign slug applied to footer site links. */
  campaign?: string;
}

/**
 * Brand shell: navy header with wordmark, optional status banner, white
 * content card, slate footer with the business address + disclosure.
 */
export function emailShell({
  preheader,
  bodyHtml,
  kicker,
  banner,
  footerReference,
  pauseUrl,
  campaign = "transactional",
}: ShellOptions): string {
  const year = new Date().getFullYear();
  const kickerHtml = kicker
    ? `<p style="margin:10px 0 0;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#8AADD1;">${esc(kicker)}</p>`
    : "";
  const bannerHtml = banner ? statusBanner(banner.tone, banner.text) : "";
  const referenceHtml = footerReference
    ? `<p style="margin:12px 0 0;font-size:11px;color:${BRAND.slate500};">Reference: <span style="font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;">${esc(footerReference)}</span></p>`
    : "";
  const pauseHtml = pauseUrl
    ? `<p style="margin:12px 0 0;font-size:11px;color:${BRAND.slate500};"><a href="${esc(pauseUrl)}" style="color:${BRAND.slate500};text-decoration:underline;">Pause payment reminders for this application</a></p>`
    : "";
  const phone = BUSINESS.supportPhone ? ` or call ${esc(BUSINESS.supportPhone)}` : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>ReelPermit</title>
</head>
<body style="margin:0;padding:0;background:#F4F6F8;font-family:${FONT_STACK};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F8;">
    <tr><td align="center" style="padding:28px 14px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:${BRAND.navy};border-radius:14px 14px 0 0;padding:26px 34px;">
          <p style="margin:0;font-size:20px;font-weight:600;color:${BRAND.white};">Cast<span style="color:#E8C47C;">line</span></p>
          ${kickerHtml}
        </td></tr>
        ${bannerHtml}

        <!-- Body card -->
        <tr><td style="background:${BRAND.white};padding:30px 34px 34px;border:1px solid ${BRAND.slate200};border-top:0;">
          ${bodyHtml}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:${BRAND.slate50};border:1px solid ${BRAND.slate200};border-top:0;border-radius:0 0 14px 14px;padding:22px 34px;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:${BRAND.slate600};">
            Questions? Just reply to this email, write to
            <a href="mailto:${esc(BUSINESS.supportEmail)}" style="color:${BRAND.forest500};font-weight:600;text-decoration:none;">${esc(BUSINESS.supportEmail)}</a>${phone}
            — a real person reads every message.
          </p>
          <p style="margin:12px 0 0;font-size:11px;line-height:1.6;color:${BRAND.slate500};">${esc(BUSINESS.legalName)} · <a href="mailto:${esc(BUSINESS.supportEmail)}" style="color:${BRAND.slate500};text-decoration:none;">${esc(BUSINESS.supportEmail)}</a></p>
          ${referenceHtml}
          ${pauseHtml}
          <p style="margin:12px 0 0;font-size:11px;color:${BRAND.slate500};">© ${year} ReelPermit · <a href="${utmLink("/", campaign)}" style="color:${BRAND.slate500};">reelpermit.local</a> · <a href="${utmLink("/terms", campaign)}" style="color:${BRAND.slate500};">Terms</a> · <a href="${utmLink("/privacy", campaign)}" style="color:${BRAND.slate500};">Privacy</a> · <a href="${utmLink("/refund", campaign)}" style="color:${BRAND.slate500};">Refund policy</a> · <a href="${utmLink("/contact", campaign)}" style="color:${BRAND.slate500};">Contact</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Footer block appended to every plain-text alternative. */
export function textFooter(opts?: { reference?: string; pauseUrl?: string }): string {
  const lines = [
    "",
    "—",
    `Questions? Just reply to this email or write to ${BUSINESS.supportEmail}.`,
    "",
    `${BUSINESS.legalName} · ${BUSINESS.supportEmail}`,
  ];
  if (opts?.reference) lines.push(`Reference: ${opts.reference}`);
  if (opts?.pauseUrl) lines.push("", `Pause payment reminders: ${opts.pauseUrl}`);
  lines.push(`© ${new Date().getFullYear()} ReelPermit — ${siteUrl()}`);
  return lines.join("\n");
}
