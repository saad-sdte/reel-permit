/**
 * Shared email layout — brand shell used by every ReelPermit email.
 *
 * Distinct from AnglerPermit: cream canvas, deep-green header, gold wordmark
 * accent, copper links. Table-based, inline styles only (Gmail-safe).
 */

export const BRAND = {
  navy: "#16332b",
  navyLight: "#215248",
  navy50: "#f4f1ea",
  navy100: "#d7e4df",
  forest: "#215248",
  forest500: "#2f6f62",
  forest50: "#e7f1ee",
  slate600: "#4a463e",
  slate500: "#7a7468",
  slate200: "#d3cdc0",
  slate50: "#fbf9f4",
  white: "#FFFFFF",
  red600: "#DC2626",
  gold: "#c4a574",
  ink: "#1a1916",
  cream: "#f4f1ea",
} as const;

export const FONT_STACK =
  "'IBM Plex Sans','Segoe UI',system-ui,-apple-system,'Helvetica Neue',Arial,sans-serif";

const DISPLAY_STACK = "Georgia,'Times New Roman',Times,serif";

/** Business identity + support contact shown in every footer. */
export const BUSINESS = {
  legalName: process.env.BUSINESS_LEGAL_NAME ?? "ReelPermit",
  address: process.env.BUSINESS_ADDRESS ?? "5900 Balcones Dr Ste 100, Austin, TX 78731",
  supportEmail: process.env.SUPPORT_EMAIL ?? "support@reelpermit.com",
  supportPhone: process.env.SUPPORT_PHONE ?? "",
} as const;

/** Status-banner tones — the 2-second scan line under the header. */
export const TONES = {
  info: { fg: "#215248", bg: "#e7f1ee", glyph: "•" },
  success: { fg: "#215248", bg: "#e7f1ee", glyph: "✓" },
  warning: { fg: "#7d6438", bg: "#f6eedc", glyph: "!" },
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
 * Bulletproof primary CTA button with a VML fallback so Outlook on Windows
 * renders it correctly.
 */
export function ctaButton(href: string, label: string): string {
  const safeHref = esc(href);
  const safeLabel = esc(label);
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;"><tr><td align="center">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeHref}" style="height:48px;v-text-anchor:middle;width:320px;" arcsize="8%" fillcolor="${BRAND.navy}" stroke="f">
        <w:anchorlock/>
        <center style="color:#FFFFFF;font-family:sans-serif;font-size:16px;font-weight:600;">${safeLabel}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${safeHref}" style="display:inline-block;min-width:220px;padding:14px 36px;border-radius:4px;background:${BRAND.navy};color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;text-align:center;line-height:20px;">${safeLabel}</a>
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
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://reelpermit.com";
}

/** A key/value row inside a details table. */
export function detailRow(label: string, value: string, opts?: { mono?: boolean; strong?: boolean }): string {
  const mono = opts?.mono ? `font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;letter-spacing:0.02em;` : "";
  const weight = opts?.strong ? "700" : "500";
  const shortLabel = label.length > 90 ? `${label.slice(0, 87)}…` : label;
  return `
    <tr>
      <td style="padding:7px 24px 7px 0;font-size:13px;line-height:1.5;color:${BRAND.slate500};vertical-align:top;width:44%;">${esc(shortLabel)}</td>
      <td style="padding:7px 0;font-size:14px;line-height:1.5;color:${BRAND.ink};font-weight:${weight};${mono}text-align:right;vertical-align:top;overflow-wrap:anywhere;">${value}</td>
    </tr>`;
}

/** A bordered card section holding detail rows. */
export function detailCard(rowsHtml: string, opts?: { heading?: string }): string {
  const heading = opts?.heading
    ? `<p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.slate500};">${esc(opts.heading)}</p>`
    : "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;border:1px solid ${BRAND.slate200};border-radius:4px;background:${BRAND.slate50};">
      <tr><td style="padding:18px 22px;">
        ${heading}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
      </td></tr>
    </table>`;
}

/** Prominent reference-number banner. */
export function referenceBanner(reference: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0;border:1px solid ${BRAND.navy100};border-radius:4px;background:${BRAND.navy50};">
      <tr><td align="center" style="padding:16px 22px;">
        <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND.slate500};">File number</p>
        <p style="margin:6px 0 0;font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;font-size:20px;font-weight:700;color:${BRAND.navy};letter-spacing:0.03em;">${esc(reference)}</p>
        <p style="margin:6px 0 0;font-size:12px;color:${BRAND.slate500};">Quote this number if you write to support.</p>
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
            <td align="center" style="width:26px;height:26px;border-radius:4px;background:${BRAND.navy};color:${BRAND.white};font-size:13px;font-weight:700;line-height:26px;">${i + 1}</td>
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
  /** Optional badge text shown in the header, e.g. "Order confirmation". */
  kicker?: string;
  /** Optional status banner (tinted strip under the header). */
  banner?: { tone: Tone; text: string };
  /** Reference number repeated small in the footer. */
  footerReference?: string;
  /** "Pause payment reminders" link — dunning emails #5–#7 ONLY. */
  pauseUrl?: string;
  /** UTM campaign slug applied to footer site links. */
  campaign?: string;
}

/**
 * Brand shell: deep-green header with serif wordmark, optional status banner,
 * cream footer, MDNR non-affiliation line.
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
    ? `<p style="margin:10px 0 0;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.gold};">${esc(kicker)}</p>`
    : "";
  const bannerHtml = banner ? statusBanner(banner.tone, banner.text) : "";
  const referenceHtml = footerReference
    ? `<p style="margin:12px 0 0;font-size:11px;color:${BRAND.slate500};">File: <span style="font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;">${esc(footerReference)}</span></p>`
    : "";
  const pauseHtml = pauseUrl
    ? `<p style="margin:12px 0 0;font-size:11px;color:${BRAND.slate500};"><a href="${esc(pauseUrl)}" style="color:${BRAND.slate500};text-decoration:underline;">Pause payment reminders for this file</a></p>`
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
<body style="margin:0;padding:0;background:${BRAND.cream};font-family:${FONT_STACK};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};">
    <tr><td align="center" style="padding:28px 14px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:${BRAND.navy};border-radius:4px 4px 0 0;padding:26px 34px;">
          <p style="margin:0;font-family:${DISPLAY_STACK};font-size:22px;font-weight:600;color:${BRAND.white};letter-spacing:-0.02em;">Reel<span style="color:${BRAND.gold};">Permit</span></p>
          ${kickerHtml}
        </td></tr>
        ${bannerHtml}

        <!-- Body card -->
        <tr><td style="background:${BRAND.white};padding:30px 34px 34px;border:1px solid ${BRAND.slate200};border-top:0;">
          ${bodyHtml}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:${BRAND.slate50};border:1px solid ${BRAND.slate200};border-top:0;border-radius:0 0 4px 4px;padding:22px 34px;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:${BRAND.slate600};">
            Questions? Reply to this email or write
            <a href="mailto:${esc(BUSINESS.supportEmail)}" style="color:${BRAND.forest500};font-weight:600;text-decoration:none;">${esc(BUSINESS.supportEmail)}</a>${phone}.
            A person on the Michigan desk reads every note.
          </p>
          <p style="margin:12px 0 0;font-size:11px;line-height:1.6;color:${BRAND.slate500};">${esc(BUSINESS.legalName)} is a private license desk — not MDNR and not a government agency.</p>
          ${referenceHtml}
          ${pauseHtml}
          <p style="margin:12px 0 0;font-size:11px;color:${BRAND.slate500};">© ${year} ReelPermit · <a href="${utmLink("/", campaign)}" style="color:${BRAND.slate500};">reelpermit.com</a> · <a href="${utmLink("/terms", campaign)}" style="color:${BRAND.slate500};">Terms</a> · <a href="${utmLink("/privacy", campaign)}" style="color:${BRAND.slate500};">Privacy</a> · <a href="${utmLink("/refund", campaign)}" style="color:${BRAND.slate500};">Refunds</a> · <a href="${utmLink("/contact", campaign)}" style="color:${BRAND.slate500};">Contact</a></p>
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
    `Questions? Reply to this email or write ${BUSINESS.supportEmail}.`,
    "ReelPermit is a private Michigan license desk — not MDNR.",
    "",
    `${BUSINESS.legalName} · ${BUSINESS.supportEmail}`,
  ];
  if (opts?.reference) lines.push(`File: ${opts.reference}`);
  if (opts?.pauseUrl) lines.push("", `Pause payment reminders: ${opts.pauseUrl}`);
  lines.push(`© ${new Date().getFullYear()} ReelPermit — ${siteUrl()}`);
  return lines.join("\n");
}
