/**
 * Customer-uploaded ID scans stored on application.formData
 * (Cloudinary HTTPS URLs or, in local/dev, data URLs).
 */

export const APPLICANT_DOCUMENT_KEYS = ["dlFrontData", "dlBackData", "dlUploadData"] as const;

const DOCUMENT_LABELS: Record<string, string> = {
  dlFrontData: "Driver license — front",
  dlBackData: "Driver license — back",
  dlUploadData: "Driver license",
};

export type ApplicantDocument = {
  key: string;
  label: string;
  fileName?: string;
  kind: "image" | "pdf";
  url: string;
};

function isImageDataUrl(value: string): boolean {
  return /^data:image\/[a-z0-9.+-]+;base64,/i.test(value);
}

function isPdfDataUrl(value: string): boolean {
  return /^data:application\/pdf;base64,/i.test(value);
}

function isImageHttpUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) return false;
  if (/res\.cloudinary\.com\//i.test(value)) return !/\/raw\/upload\//i.test(value);
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(value);
}

function isPdfHttpUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) return false;
  return /\.pdf(\?|#|$)/i.test(value) || /\/raw\/upload\//i.test(value);
}

export function isStoredDocumentValue(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (!v) return false;
  return isImageDataUrl(v) || isPdfDataUrl(v) || isImageHttpUrl(v) || isPdfHttpUrl(v);
}

function documentKind(url: string): "image" | "pdf" {
  return isPdfDataUrl(url) || isPdfHttpUrl(url) ? "pdf" : "image";
}

function companionFileName(formData: Record<string, unknown>, dataKey: string): string | undefined {
  for (const key of [dataKey.replace(/Data$/, "Name"), dataKey.replace(/Data$/, "FileName")]) {
    const v = formData[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function looksLikeUploadKey(key: string): boolean {
  if ((APPLICANT_DOCUMENT_KEYS as readonly string[]).includes(key)) return true;
  return /Data$/i.test(key) && /(dl|id|upload|file|license|scan|doc)/i.test(key);
}

function humanLabel(key: string): string {
  if (DOCUMENT_LABELS[key]) return DOCUMENT_LABELS[key];
  return key
    .replace(/Data$/i, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

/** True when form_data contains at least one viewable scan/upload. */
export function formHasApplicantDocuments(formData: Record<string, unknown> | null | undefined): boolean {
  if (!formData) return false;
  return extractApplicantDocuments(formData).length > 0;
}

export function extractApplicantDocuments(
  formData: Record<string, unknown> | null | undefined,
): ApplicantDocument[] {
  if (!formData) return [];
  const docs: ApplicantDocument[] = [];
  for (const [key, value] of Object.entries(formData)) {
    if (!looksLikeUploadKey(key) || !isStoredDocumentValue(value)) continue;
    docs.push({
      key,
      label: humanLabel(key),
      fileName: companionFileName(formData, key),
      kind: documentKind(value),
      url: value,
    });
  }
  const rank = (key: string) => {
    const i = (APPLICANT_DOCUMENT_KEYS as readonly string[]).indexOf(key);
    return i === -1 ? 100 : i;
  };
  return docs.sort((a, b) => rank(a.key) - rank(b.key) || a.key.localeCompare(b.key));
}

export const APPLICANT_DOCUMENT_FORM_KEYS = new Set<string>([
  ...APPLICANT_DOCUMENT_KEYS,
  "dlFrontName",
  "dlBackName",
  "dlUploadName",
  "dlUploadFileName",
]);
