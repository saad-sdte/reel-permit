/**
 * Portal autofill payload for the ReelPermit Ops Chrome extension.
 * Built from CRM application rows. Text fields and ID images (data URLs or
 * Cloudinary HTTPS) are included; payment/password are never filled.
 */

export const PORTAL_FILL_MESSAGE = "AP_PORTAL_FILL" as const;
export const PORTAL_FILL_ACK = "AP_PORTAL_FILL_ACK" as const;
export const PORTAL_FILL_PING = "AP_PORTAL_FILL_PING" as const;
export const PORTAL_FILL_PONG = "AP_PORTAL_FILL_PONG" as const;

export type PortalFillStateSlug =
  | "michigan"
  | "texas"
  | "florida"
  | "north-carolina"
  | "south-carolina"
  | "california"
  | "colorado";

/** ID image / PDF the extension should attach to a file input. */
export interface PortalFillFile {
  key: string;
  /** data: URL or https URL (typically Cloudinary). */
  src: string;
  name: string;
  mime: string;
}

export interface PortalFillPayload {
  version: 1;
  stateSlug: PortalFillStateSlug;
  reference: string;
  portalName: string;
  portalUrl: string;
  createUrl: string;
  licenseId: string;
  licenseName: string | null;
  residency: string;
  fields: Record<string, string>;
  files: PortalFillFile[];
  preparedAt: string;
}

const UPLOAD_KEY =
  /^(dlFrontData|dlBackData|dlUploadData|.*UploadData|.*FileData)$/i;

const UPLOAD_NAME_KEY =
  /^(dlFrontName|dlBackName|dlUploadName|dlUploadFileName|.*UploadName|.*FileName)$/i;

const DATE_KEYS = /^(dateOfBirth|birthDate|dob|licenseStartDate|dlExpirationDate)$/i;

export const PORTAL_BY_SLUG: Record<
  PortalFillStateSlug,
  { portalName: string; portalUrl: string; createUrl: string }
> = {
  michigan: {
    portalName: "Michigan DNR eLicense",
    portalUrl: "https://mdnr-elicense.com/",
    // Official first customer step is Sign In → ID & Birthdate Search.
    // Create (/Customer/Create) is the later New Customer form.
    createUrl: "https://mdnr-elicense.com/Customer/Login?mode=0",
  },
  texas: {
    portalName: "Texas License Connection",
    portalUrl: "https://txfgsales.com/",
    createUrl: "https://txfgsales.com/",
  },
  florida: {
    portalName: "Go Outdoors Florida",
    portalUrl: "https://gooutdoorsflorida.com/",
    createUrl: "https://license.gooutdoorsflorida.com/Licensing/CreateCustomer.aspx",
  },
  "north-carolina": {
    portalName: "Go Outdoors North Carolina",
    portalUrl: "https://license.gooutdoorsnorthcarolina.com/Licensing/CustomerLookup.aspx",
    createUrl: "https://license.gooutdoorsnorthcarolina.com/Licensing/CustomerLookup.aspx",
  },
  "south-carolina": {
    portalName: "Go Outdoors South Carolina",
    portalUrl: "https://gooutdoorssouthcarolina.com/",
    createUrl: "https://license.gooutdoorssouthcarolina.com/Licensing/CustomerLookup.aspx",
  },
  california: {
    portalName: "CDFW Online License Sales",
    portalUrl: "https://www.licenses.wildlife.ca.gov/internetsales/",
    createUrl: "https://www.licenses.wildlife.ca.gov/internetsales/CustomerSearch/Begin",
  },
  colorado: {
    portalName: "CPWshop",
    portalUrl: "https://www.cpwshop.com",
    createUrl: "https://www.cpwshop.com/signup.page",
  },
};

function isDataUrl(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:");
}

function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function isUploadSrc(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  if (/^data:(image|application)\/[a-z0-9.+-]+;base64,/i.test(value)) return true;
  if (!isHttpUrl(value)) return false;
  if (/res\.cloudinary\.com\//i.test(value)) return true;
  return /\.(png|jpe?g|gif|webp|bmp|pdf)(\?|#|$)/i.test(value);
}

function mimeFromSrc(src: string): string {
  const data = /^data:([^;,]+)/i.exec(src);
  if (data) return data[1];
  if (/\.pdf(\?|#|$)/i.test(src) || /\/raw\/upload\//i.test(src)) return "application/pdf";
  if (/\.png(\?|#|$)/i.test(src)) return "image/png";
  if (/\.webp(\?|#|$)/i.test(src)) return "image/webp";
  if (/\.gif(\?|#|$)/i.test(src)) return "image/gif";
  return "image/jpeg";
}

function defaultFileName(key: string, mime: string): string {
  const ext = mime.includes("pdf")
    ? "pdf"
    : mime.includes("png")
      ? "png"
      : mime.includes("webp")
        ? "webp"
        : mime.includes("gif")
          ? "gif"
          : "jpg";
  const base =
    key === "dlFrontData"
      ? "dl-front"
      : key === "dlBackData"
        ? "dl-back"
        : key === "dlUploadData"
          ? "dl-upload"
          : key.replace(/Data$/i, "") || "id-upload";
  return `${base}.${ext}`;
}

function companionFileName(
  formData: Record<string, unknown>,
  dataKey: string,
): string | undefined {
  for (const key of [dataKey.replace(/Data$/, "Name"), dataKey.replace(/Data$/, "FileName")]) {
    const v = formData[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

/** Pull DL / ID image fields out of CRM form_data for the Ops extension. */
export function extractPortalFiles(
  formData: Record<string, unknown> | null | undefined,
): PortalFillFile[] {
  const files: PortalFillFile[] = [];
  if (!formData) return files;
  for (const [key, value] of Object.entries(formData)) {
    if (!UPLOAD_KEY.test(key) && !(isDataUrl(value) && isUploadSrc(value))) continue;
    if (!isUploadSrc(value)) continue;
    const mime = mimeFromSrc(value);
    files.push({
      key,
      src: value,
      name: companionFileName(formData, key) || defaultFileName(key, mime),
      mime,
    });
  }
  return files;
}

function stringifyField(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    const t = value.trim();
    return t ? t : null;
  }
  return null;
}

/** Normalize CRM date values to mm/dd/yyyy when possible. */
export function toPortalDob(raw: unknown): string | null {
  const s = stringifyField(raw);
  if (!s) return null;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) return s;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[2]}/${iso[3]}/${iso[1]}`;
  return s;
}

export function stripFormDataForPortal(
  formData: Record<string, unknown> | null | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!formData) return out;
  for (const [key, value] of Object.entries(formData)) {
    if (UPLOAD_KEY.test(key) || UPLOAD_NAME_KEY.test(key) || isDataUrl(value) || isUploadSrc(value))
      continue;
    if (DATE_KEYS.test(key)) {
      const dob = toPortalDob(value);
      if (dob) out[key] = dob;
      continue;
    }
    const s = stringifyField(value);
    if (s) out[key] = s;
  }
  return out;
}

export function normalizeStateSlug(slug: string): PortalFillStateSlug | null {
  const s = slug.trim().toLowerCase();
  if (s === "mi") return "michigan";
  if (s === "tx") return "texas";
  if (s === "fl") return "florida";
  if (s === "nc" || s === "northcarolina") return "north-carolina";
  if (s === "sc" || s === "southcarolina") return "south-carolina";
  if (s === "ca") return "california";
  if (s === "co") return "colorado";
  if (s in PORTAL_BY_SLUG) return s as PortalFillStateSlug;
  return null;
}

export function isSupportedPortalState(slug: string): boolean {
  return normalizeStateSlug(slug) !== null;
}

/** Local mock hub — ?state=<slug> */
export const PORTAL_LOCAL_MOCK_PATH = "/dev/portal-mock.html";

/** @deprecated use PORTAL_LOCAL_MOCK_PATH */
export const MI_LOCAL_MOCK_PATH = "/dev/mi-portal-mock.html";

export function buildPortalFillPayload(input: {
  stateSlug: string;
  reference: string;
  licenseId: string;
  licenseName?: string | null;
  residency: string;
  formData: Record<string, unknown> | null | undefined;
}): PortalFillPayload | null {
  const stateSlug = normalizeStateSlug(input.stateSlug);
  if (!stateSlug) return null;
  const meta = PORTAL_BY_SLUG[stateSlug];
  return {
    version: 1,
    stateSlug,
    reference: input.reference,
    portalName: meta.portalName,
    portalUrl: meta.portalUrl,
    createUrl: meta.createUrl,
    licenseId: input.licenseId,
    licenseName: input.licenseName ?? null,
    residency: input.residency,
    fields: stripFormDataForPortal(input.formData),
    files: extractPortalFiles(input.formData),
    preparedAt: new Date().toISOString(),
  };
}

/** @deprecated use buildPortalFillPayload */
export function buildMichiganPortalFillPayload(input: {
  reference: string;
  licenseId: string;
  licenseName?: string | null;
  residency: string;
  formData: Record<string, unknown> | null | undefined;
}): PortalFillPayload {
  return buildPortalFillPayload({ ...input, stateSlug: "michigan" })!;
}

export function isMichiganStateSlug(slug: string): boolean {
  return normalizeStateSlug(slug) === "michigan";
}
