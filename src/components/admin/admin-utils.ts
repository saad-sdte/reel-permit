import type { ApplicationStatus } from "@/lib/storage";

export const STATES = [
  "florida",
  "south-carolina",
  "michigan",
  "texas",
  "california",
  "colorado",
  "north-carolina",
] as const;

export const STATUS_COLOR: Record<string, string> = {
  pending_payment: "#b45309",
  payment_failed: "#b91c1c",
  received: "#0f766e",
  processing: "#1d4ed8",
  missing_info: "#c2410c",
  future_pending: "#0369a1",
  delivered: "#15803d",
  cancelled: "#64748b",
  refunded: "#6d28d9",
};

export const STATUS_BG: Record<string, string> = {
  pending_payment: "rgba(180, 83, 9, 0.12)",
  payment_failed: "rgba(185, 28, 28, 0.12)",
  received: "rgba(15, 118, 110, 0.12)",
  processing: "rgba(29, 78, 216, 0.12)",
  missing_info: "rgba(194, 65, 12, 0.12)",
  future_pending: "rgba(3, 105, 161, 0.12)",
  delivered: "rgba(21, 128, 61, 0.12)",
  cancelled: "rgba(100, 116, 139, 0.14)",
  refunded: "rgba(109, 40, 217, 0.12)",
};

const FIELD_LABELS: Record<string, string> = {
  firstName: "First name",
  middleName: "Middle name",
  lastName: "Last name",
  email: "Email",
  primaryPhone: "Phone",
  primaryPhoneType: "Primary phone type",
  phone: "Phone",
  dateOfBirth: "Date of birth",
  gender: "Gender",
  suffix: "Suffix",
  heightFt: "Height (ft)",
  heightIn: "Height (in)",
  weightPounds: "Weight (lb)",
  idType: "ID type",
  idNumber: "ID number",
  driversLicenseState: "Driver license state",
  resStreet1: "Street",
  resStreet2: "Street 2",
  street: "Street",
  address: "Address",
  attentionLine: "Attention line",
  resCity: "City",
  city: "City",
  resState: "State / region",
  state: "State",
  resZip: "ZIP / postal",
  zipCode: "Postal code",
  resCountry: "Country",
  country: "Country",
  internationalProvince: "International province",
  residency: "Residency",
  ssn: "SSN",
  socialSecurityNumber: "SSN",
  nonUsAddress: "Non-US address",
  michiganResident: "Michigan resident",
  licenseStartDate: "License start",
  updatesEmail: "Email updates",
  updatesText: "Text updates",
  dlFrontName: "Driver license (front) file",
  dlFrontData: "Driver license — front",
  dlBackName: "Driver license (back) file",
  dlBackData: "Driver license — back",
  dlUploadName: "Driver license file",
  dlUploadFileName: "Driver license file",
  dlUploadData: "Driver license",
};

/** Image data-URL stored in form_data (JPG/PNG/etc.). */
export function isImageDataUrl(value: unknown): value is string {
  return typeof value === "string" && /^data:image\/[a-z0-9.+-]+;base64,/i.test(value);
}

/** PDF data-URL stored in form_data. */
export function isPdfDataUrl(value: unknown): value is string {
  return typeof value === "string" && /^data:application\/pdf;base64,/i.test(value);
}

/** HTTPS image URL (Cloudinary or other CDN) suitable for <img> preview. */
export function isImageHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!/^https?:\/\//i.test(value)) return false;
  if (/res\.cloudinary\.com\//i.test(value)) {
    return !/\/raw\/upload\//i.test(value);
  }
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(value);
}

/** HTTPS PDF URL suitable for embedded preview. */
export function isPdfHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value)) return false;
  return /\.pdf(\?|#|$)/i.test(value) || /\/raw\/upload\//i.test(value);
}

/** Any stored attachment value that should render as a media preview. */
export function isImagePreviewValue(value: unknown): value is string {
  return isImageDataUrl(value) || isImageHttpUrl(value);
}

export function isPdfPreviewValue(value: unknown): value is string {
  return isPdfDataUrl(value) || isPdfHttpUrl(value);
}

/** Companion filename key for a *Data upload field, if present. */
export function attachmentFileName(
  formData: Record<string, unknown>,
  dataKey: string,
): string | undefined {
  const candidates = [
    dataKey.replace(/Data$/, "Name"),
    dataKey.replace(/Data$/, "FileName"),
  ];
  for (const key of candidates) {
    const v = formData[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

/** Filename keys that should be hidden when the matching *Data preview is shown. */
export function companionNameKeysToHide(formData: Record<string, unknown>): Set<string> {
  const hide = new Set<string>();
  for (const [key, value] of Object.entries(formData)) {
    if (!isImagePreviewValue(value) && !isPdfPreviewValue(value)) continue;
    hide.add(key.replace(/Data$/, "Name"));
    hide.add(key.replace(/Data$/, "FileName"));
  }
  return hide;
}

/** True when a stored SSN value is only the masked last-4 form. */
export function isMaskedSsnValue(key: string, value: unknown): boolean {
  if (!/ssn|social/i.test(key)) return false;
  const s = String(value ?? "");
  return /^\*{3}-\*{2}-\d{4}$/.test(s) || s === "***-**-****";
}

export function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function labelStatus(s: string) {
  return s.replace(/_/g, " ");
}

export function stateLabel(slug: string) {
  return slug
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

export function fieldLabel(key: string) {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function formatFieldValue(v: unknown): string {
  if (v == null || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

export function customerName(first?: string | null, last?: string | null) {
  const name = [first, last].filter(Boolean).join(" ").trim();
  return name || "—";
}

export const ALL_STATUSES = Object.keys(STATUS_COLOR) as ApplicationStatus[];
