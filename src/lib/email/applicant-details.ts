import type { FormFieldDef, StateConfig } from "@/lib/state-config";
import { detailCard, detailRow, esc } from "./email-layout";

function formatValue(value: unknown): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/**
 * Pretty-print a raw date field value (ISO YYYY-MM-DD from <input type="date">
 * or masked MM/DD/YYYY from DOB fields) as "Aug 4, 2026". Falls back to the
 * raw string if the value can't be parsed so nothing is dropped in email.
 */
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

function formatFieldValue(field: FormFieldDef, value: unknown): string {
  if (field.type === "date") return formatDateValue(value);
  if (field.type === "select" || field.type === "radio") {
    const label = field.options?.find((o) => o.value === value)?.label;
    if (label) return label;
  }
  return formatValue(value);
}

function prettyKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

/**
 * Renders every submitted applicant field in state-config order (then extras).
 * Expects MASKED data only (SSN already ***-**-####).
 */
export function buildApplicantDetails(
  config: StateConfig | null | undefined,
  data: Record<string, unknown> | null | undefined,
  opts?: { heading?: string },
): { html: string; textLines: string[] } {
  if (!data || Object.keys(data).length === 0) {
    return { html: "", textLines: [] };
  }

  const heading = opts?.heading ?? "Your application details";
  const rendered = new Set<string>();
  const rows: string[] = [];
  const textLines: string[] = [];

  if (config) {
    for (const field of config.formFields) {
      if (!(field.name in data)) continue;
      rendered.add(field.name);
      const value = formatFieldValue(field, data[field.name]);
      const label = field.label.replace(/:\s*$/, "");
      rows.push(detailRow(label, esc(value)));
      textLines.push(`${label}: ${value}`);
    }
  }

  for (const [key, value] of Object.entries(data)) {
    if (rendered.has(key)) continue;
    const v = formatValue(value);
    const label = prettyKey(key);
    rows.push(detailRow(label, esc(v)));
    textLines.push(`${label}: ${v}`);
  }

  if (!rows.length) return { html: "", textLines: [] };

  return {
    html: `${detailCard(rows.join(""), { heading })}
    <p style="margin:10px 0 0;font-size:12px;line-height:1.5;color:#64748B;">
      Sensitive identifiers such as Social Security numbers are masked (***-**-last4) for your security.
    </p>`,
    textLines: [
      heading.toUpperCase(),
      ...textLines,
      "",
      "Sensitive identifiers such as Social Security numbers are masked (***-**-last4) for your security.",
    ],
  };
}
