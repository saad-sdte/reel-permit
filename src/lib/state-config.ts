import { z } from "zod";

/**
 * StateConfig — the SINGLE shared contract for every state page.
 * Implemented verbatim from /spec/stateconfig.md.
 * State agents: do NOT modify this file. Add your state in src/data/states/<slug>.ts.
 */

/**
 * Global price multiplier applied to all license/add-on prices — edit here.
 *
 * Per-state data files keep the RESEARCHED base prices verbatim (do not edit
 * them for pricing). Every price shown to a user — license cards, add-ons,
 * price summary, review, the payment step, and the server-side charge amount —
 * is the base price run through displayPrice() at DISPLAY time, so the markup
 * lives in exactly one place.
 *
 * Honesty rule: marked-up prices must never be labeled "official fee",
 * "official state fee", or "state fee". The total is a single bundled price
 * (no separate service-fee line — our margin is inside the total).
 */
/** Customer price = base × markup. Raised 50% from the previous 3× bundled pricing. */
export const PRICE_MARKUP = 4.5;

/** Convert a researched base price to the price shown to (and charged to) the customer. */
export function displayPrice(basePrice: number): number {
  // Round to cents so charge totals match advertised prices exactly.
  return Math.round(basePrice * PRICE_MARKUP * 100) / 100;
}

/**
 * Server-authoritative order total (in USD) for a license + add-ons.
 * ALWAYS computed from the state config — never trust a client-sent amount.
 */
export function computeOrderTotal(
  config: StateConfig,
  licenseId: string,
  addOnIds: string[],
): number {
  const license = config.licenses.find((l) => l.id === licenseId);
  const applicable = addOnsForLicense(config, licenseId || undefined);
  const selected = applicable.filter((a) => a.required || addOnIds.includes(a.id));
  const base =
    (license?.price ?? 0) + selected.reduce((sum, a) => sum + a.price, 0);
  return displayPrice(base);
}

export type FieldType =
  | "text" | "email" | "tel" | "date" | "select" | "radio" | "checkbox"
  | "ssn" | "number" | "zip" | "textarea";

export interface FieldOption {
  value: string;
  label: string;
}

export interface ConditionalRule {
  field: string; // name of the controlling applicant field; the wizard also
  // exposes "licenseId" so a field can condition on the selected license
  equals?: string; // show this field when controlling field === value
  oneOf?: string[]; // show when controlling field is one of these
}

export interface FormFieldDef {
  name: string; // camelCase key, e.g. 'firstName'
  label: string; // EXACT label from official portal
  type: FieldType;
  required: boolean;
  options?: FieldOption[]; // for select/radio — EXACT official options
  placeholder?: string;
  helpText?: string; // e.g. "Why is this required?" explainer
  mask?: "ssn" | "phone" | "dob" | "zip"; // input mask
  autocomplete?: string; // e.g. 'given-name', 'email'
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    patternMessage?: string;
    min?: number;
    max?: number;
  };
  conditional?: ConditionalRule; // conditional display logic
  /** Initial value for new applications (e.g. country defaulting to US). */
  defaultValue?: string | boolean;
  /**
   * Never render this field, but keep it in the submitted data. Used for
   * portal fields that are fully derived from an earlier answer — e.g. MI
   * "michiganResident" is auto-set from the Step 1 residency choice, so
   * re-asking it on the applicant step is redundant. The value is still
   * validated and sent to the official portal.
   */
  hidden?: boolean;
  step: 2; // all applicant fields are wizard step 2
  /**
   * Optional grouping label for the applicant step. When fields define a
   * section, the wizard pages the applicant step into one sub-step per
   * section (in first-seen order). States that omit section render all
   * applicant fields on a single page (legacy behavior).
   */
  section?: string;
  officialNote?: string; // provenance note / TODO: verify + URL
}

export interface AddOn {
  id: string; // kebab-case, e.g. 'second-rod-validation'
  name: string; // EXACT official name
  price: number; // official price in USD
  required: boolean; // e.g. CO Habitat Stamp auto-added
  appliesTo?: string[]; // license ids it applies to; omit = all
  description?: string;
  officialNote?: string;
}

export interface LicenseOption {
  id: string; // kebab-case
  name: string; // EXACT official license name
  price: number; // official price USD
  residency: "resident" | "nonresident" | "senior" | "youth" | "any";
  duration: string; // e.g. 'Annual', '1-Day', '10-Day', 'Lifetime'
  category: "freshwater" | "saltwater" | "all-water" | "combo" | "other";
  description?: string;
  suggestedAddOns?: string[]; // add-on ids commonly paired
  officialNote?: string;
}

export interface StateConfig {
  slug: string; // 'michigan' | 'california' | 'texas' | 'colorado' |
  // 'north-carolina' | 'florida' | 'south-carolina'
  stateName: string; // 'Michigan'
  officialAgencyName: string; // 'Michigan Department of Natural Resources'
  officialPortalName: string; // 'Michigan DNR eLicense'
  officialPortalUrl: string; // https://...
  lastVerified: string; // 'YYYY-MM-DD'
  /** @deprecated REMOVED concept: the $29 flat service fee no longer exists.
   * Pricing is a single bundled total — displayPrice() marks up license/add-on
   * base prices (see PRICE_MARKUP) and our margin lives inside that total.
   * Optional only so legacy data files parse; do not set or use. */
  serviceFee?: number;
  requiresSSN: boolean; // show masked SSN field w/ explainer
  ssnExplainer?: string; // state-law one-liner
  residencyOptions: { value: string; label: string }[]; // drives license filtering
  licenseYearNote?: string; // e.g. TX: 'Valid Sep 1 – Aug 31'
  licenses: LicenseOption[];
  addOns: AddOn[];
  formFields: FormFieldDef[]; // EXACT official applicant fields, in order
  stateIdentifiers?: {
    // e.g. CA GO ID, MI DNR Sportcard, TX customer #
    name: string;
    label: string;
    helpText: string;
    required: boolean;
  }[];
  consentExtra?: string; // state-specific consent text if any
  researchNotes?: string; // free-form provenance, discrepancies
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Map a residency selection to its pricing tier.
 *
 * Every state sells exactly two price tiers: resident and nonresident.
 * Selections such as TX "senior" / "youth" or NC "Full Time NC Student" /
 * "Military Stationed In NC" / "Nonresident Active Duty Military" are all
 * RESIDENT-priced under state rules, so any value that is not
 * nonresident-like maps to the resident tier (generic alias mechanism).
 */
export function residencyPricingTier(residency: string): "resident" | "nonresident" {
  const normalized = residency.trim().toLowerCase().replace(/[^a-z]/g, "");
  // CA competitor-style options (U.S. Citizen / International) price as nonresident.
  if (
    normalized === "nonresident" ||
    normalized === "uscitizen" ||
    normalized === "international" ||
    normalized === "internationalcustomer"
  ) {
    return "nonresident";
  }
  return "resident";
}

/**
 * Licenses visible for a given residency selection.
 *
 * - No selection: the full catalog is shown (the wizard prompts for residency).
 * - Nonresident tier: nonresident + any.
 * - Resident tier (resident, senior, youth, NC student/military aliases):
 *   resident + senior + youth + any. Senior/youth licenses in all seven
 *   states' data are resident-tier; their names/descriptions carry the age
 *   terms, so residents of any age see every license they can buy.
 */
export function licensesForResidency(
  config: StateConfig,
  residency: string | undefined,
): LicenseOption[] {
  if (!residency) return config.licenses;
  const tier = residencyPricingTier(residency);
  return config.licenses.filter((l) => {
    if (l.residency === "any") return true;
    if (tier === "nonresident") return l.residency === "nonresident";
    return l.residency !== "nonresident";
  });
}

/** Add-ons applicable to a given license (omit appliesTo = applies to all). */
export function addOnsForLicense(
  config: StateConfig,
  licenseId: string | undefined,
): AddOn[] {
  return config.addOns.filter(
    (a) => !a.appliesTo || (licenseId ? a.appliesTo.includes(licenseId) : true),
  );
}

/**
 * Strip internal provenance fields (officialNote / researchNotes) before a
 * config is serialized to the browser. These are research-only annotations
 * and are never user-facing — omitting them keeps page payloads clean.
 */
export function publicConfig(config: StateConfig): StateConfig {
  const strip = <T extends { officialNote?: string }>(obj: T): T => {
    const clone = { ...obj };
    delete clone.officialNote;
    return clone;
  };
  return {
    ...config,
    researchNotes: undefined,
    licenses: config.licenses.map(strip),
    addOns: config.addOns.map(strip),
    formFields: config.formFields.map(strip),
  };
}

/** Parse MM/DD/YYYY to a UTC date, or null if invalid / empty. */
export function parseMmDdYyyy(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

/** Parse an <input type="date"> value (YYYY-MM-DD) to a UTC date, or null. */
export function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

/**
 * Number of consecutive days a short-term license is valid for, parsed
 * from its `duration` string. Returns null for annual/lifetime/unknown.
 *
 * Handles the verbatim strings used across the seven state configs:
 *   - "1-Day", "2-Day", ..., "14-Day"                → the leading N
 *   - "3-Day (consecutive days from specified ...)"  → the leading N
 *   - "Additional Day"                               → 1 (CPW extension)
 *   - "Annual", "Annual (...)", "3-Year", "Lifetime" → null
 */
export function licenseDurationDays(duration: string | undefined): number | null {
  if (!duration) return null;
  const dayMatch = duration.trim().match(/^(\d+)-Day/i);
  if (dayMatch) {
    const days = Number(dayMatch[1]);
    return Number.isFinite(days) && days > 0 ? days : null;
  }
  if (/^additional\s+day/i.test(duration.trim())) return 1;
  return null;
}

/**
 * Compute the inclusive last day a short-term license is valid, given the
 * user-selected start date and the SKU's duration string. Returns null if
 * either input is missing/invalid or the SKU is not day-based.
 *
 * A 1-Day license starting Aug 4 ends on Aug 4. A 3-Day license starting
 * Aug 4 ends on Aug 6 (start + duration - 1).
 */
export function computeLicenseEndDate(
  startDate: Date | null,
  duration: string | undefined,
): Date | null {
  const days = licenseDurationDays(duration);
  if (!startDate || days == null) return null;
  const end = new Date(startDate.getTime());
  end.setUTCDate(end.getUTCDate() + days - 1);
  return end;
}

/**
 * Human-readable range like "Aug 4, 2026 – Aug 6, 2026 (3 days)" for a
 * short-term license, or a single date for 1-Day. Returns null when the
 * start date is missing/invalid or the SKU is not day-based.
 */
export function formatLicenseDateRange(
  startValue: unknown,
  duration: string | undefined,
): string | null {
  const start =
    typeof startValue === "string" && startValue.includes("-")
      ? parseIsoDate(startValue)
      : parseMmDdYyyy(startValue);
  const end = computeLicenseEndDate(start, duration);
  if (!start || !end) return null;
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const days = licenseDurationDays(duration) ?? 1;
  if (start.getTime() === end.getTime()) {
    return `${fmt.format(start)} (1 day)`;
  }
  return `${fmt.format(start)} \u2013 ${fmt.format(end)} (${days} days)`;
}

/** True when a conditional field should be visible given current values. */
export function isFieldVisible(
  field: FormFieldDef,
  values: Record<string, unknown>,
): boolean {
  if (!field.conditional) return true;
  const controlling = values[field.conditional.field];
  const asString =
    typeof controlling === "string" ? controlling : String(controlling ?? "");
  if (field.conditional.equals !== undefined) {
    if (asString !== field.conditional.equals) return false;
  } else if (field.conditional.oneOf) {
    if (!field.conditional.oneOf.includes(asString)) return false;
  }
  return true;
}

/**
 * Whether a visible field must be filled right now.
 * SC hunter-ed is required for hunting licenses only when DOB is after 1979-06-30
 * (or DOB not yet entered — fail closed so the applicant can't skip it).
 */
export function isFieldEffectivelyRequired(
  config: StateConfig,
  field: FormFieldDef,
  values: Record<string, unknown>,
): boolean {
  if (!field.required) return false;
  if (!isFieldVisible(field, values)) return false;
  if (
    config.slug === "south-carolina" &&
    (field.name === "hunterEducationNumber" ||
      field.name === "hunterEducationStateOfIssue")
  ) {
    const dob = parseMmDdYyyy(values.dateOfBirth);
    // Born on or before June 30, 1979 → hunter ed not required by SCDNR.
    if (dob && dob.getTime() <= Date.UTC(1979, 5, 30)) return false;
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* Zod schema generation                                               */
/* ------------------------------------------------------------------ */

const SSN_PATTERN = /^\d{3}-\d{2}-\d{4}$/;
const ZIP_PATTERN = /^\d{5}(-\d{4})?$/;
const PHONE_PATTERN = /\d/;
const DOB_PATTERN = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;

/** Normalize empty / missing input so optional fields accept "" and required fields produce friendly messages. */
function normalizeEmpty(value: unknown): unknown {
  if (value === undefined || value === null) return "";
  return value;
}

/**
 * Matches digits-only field patterns such as ^\d{4}$ / ^\d{9}$ and returns
 * the required digit count (null for any other pattern). Drives live
 * digits-only input behavior (e.g. NC last-4-of-SSN). Phone fields are not
 * length-capped.
 */
export function digitsOnlyPatternCount(pattern: string | undefined): number | null {
  if (!pattern) return null;
  const match = pattern.match(/^\^\\d\{(\d+)\}\$$/);
  return match ? Number(match[1]) : null;
}

/**
 * Build a zod schema for ONE form field from its definition.
 * Every supported FieldType is handled.
 */
export function buildFieldSchema(field: FormFieldDef): z.ZodTypeAny {
  // Official labels are kept verbatim in state data — including trailing
  // colons ("First Name:") — so strip the colon when composing messages
  // ("First Name: is required" reads like a bug).
  const label = field.label.replace(/:\s*$/, "");
  const v = field.validation ?? {};

  switch (field.type) {
    case "email": {
      const s = z.string().email(`Enter a valid email address`);
      return wrapRequired(s, field, label);
    }
    case "tel": {
      // Phone fields accept any number of digits. Do not enforce a 10-digit
      // NANP length — customers may enter country codes and international numbers.
      const s = z
        .string()
        .regex(PHONE_PATTERN, v.patternMessage ?? `Enter a valid phone number`);
      return wrapRequired(s, field, label);
    }
    case "date": {
      // Field-level pattern wins; then DOB-style mask (MM/DD/YYYY); else free date string.
      const s = v.pattern
        ? z
            .string()
            .regex(new RegExp(v.pattern), v.patternMessage ?? `${label} is not in the expected format`)
        : field.mask === "dob"
          ? z.string().regex(DOB_PATTERN, `Enter ${label} as MM/DD/YYYY`)
          : z.string().min(1, `${label} is required`);
      return wrapRequired(s, field, label);
    }
    case "ssn": {
      // A field-level validation.pattern (e.g. TX/FL/CO/NC raw 9-digit) takes
      // precedence over the default dashed 123-45-6789 pattern.
      const s = v.pattern
        ? z
            .string()
            .regex(new RegExp(v.pattern), v.patternMessage ?? `Enter a valid Social Security number`)
        : z
            .string()
            .regex(SSN_PATTERN, `Enter a valid SSN in the format 123-45-6789`);
      return wrapRequired(s, field, label);
    }
    case "zip": {
      const s = v.pattern
        ? z
            .string()
            .regex(new RegExp(v.pattern), v.patternMessage ?? `Enter a valid ZIP code`)
        : z
            .string()
            .regex(ZIP_PATTERN, `Enter a valid ZIP code, e.g. 12345 or 12345-6789`);
      return wrapRequired(s, field, label);
    }
    case "select":
    case "radio": {
      const values = (field.options ?? []).map((o) => o.value);
      const s = z
        .string()
        .min(1, `${label} is required`)
        .refine((val) => values.length === 0 || values.includes(val), {
          message: `Select a valid option for ${label}`,
        });
      return wrapRequired(s, field, label);
    }
    case "checkbox": {
      if (field.required) {
        return z.literal(true, {
          error: `${label} must be checked to continue`,
        });
      }
      return z.boolean().optional();
    }
    case "number": {
      let n = z.coerce.number();
      if (v.min !== undefined) n = n.min(v.min, `${label} must be at least ${v.min}`);
      if (v.max !== undefined) n = n.max(v.max, `${label} must be at most ${v.max}`);
      if (!field.required) {
        return z.preprocess(
          (val) => (val === "" || val === undefined || val === null ? undefined : val),
          n.optional(),
        );
      }
      return z.preprocess((val) => (val === "" ? Number.NaN : val), n);
    }
    case "textarea":
    case "text":
    default: {
      let s = z.string();
      if (v.minLength) s = s.min(v.minLength, `${label} must be at least ${v.minLength} characters`);
      if (v.maxLength) s = s.max(v.maxLength, `${label} must be at most ${v.maxLength} characters`);
      if (v.pattern) {
        s = s.regex(new RegExp(v.pattern), v.patternMessage ?? `${label} is not in the expected format`);
      }
      return wrapRequired(s, field, label);
    }
  }
}

/** Apply required/optional semantics to string-ish schemas. */
function wrapRequired(
  inner: z.ZodTypeAny,
  field: FormFieldDef,
  label: string,
): z.ZodTypeAny {
  if (field.required) {
    // Empty/missing input must fail with a friendly message even when no other rule catches it.
    return z.preprocess(
      normalizeEmpty,
      z.string().min(1, `${label} is required`).pipe(inner as z.ZodType<unknown, string>),
    );
  }
  return z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : value),
    inner.optional(),
  );
}

/**
 * Build the applicant-data zod schema from a StateConfig's formFields.
 * Conditional fields are validated only when their condition is met.
 */
export function buildApplicantSchema(
  config: StateConfig,
): z.ZodType<Record<string, unknown>> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of config.formFields) {
    shape[field.name] = field.conditional
      ? z.unknown().optional() // validated in superRefine below when visible
      : buildFieldSchema(field);
  }

  return z
    .object(shape)
    .passthrough()
    .superRefine((values, ctx) => {
      const record = values as Record<string, unknown>;
      for (const field of config.formFields) {
        if (!field.conditional) continue;
        if (!isFieldVisible(field, record)) continue;
        const result = buildFieldSchema(field).safeParse(record[field.name]);
        if (!result.success) {
          for (const issue of result.error.issues) {
            ctx.addIssue({ code: "custom", path: [field.name], message: issue.message });
          }
        }
      }
    }) as unknown as z.ZodType<Record<string, unknown>>;
}

/**
 * The single legally required consent (friction-reduced).
 *
 * The separate "authorize ReelPermit to purchase on my behalf" checkbox was
 * REMOVED: the agency authorization now lives in the Terms of Service
 * ("Authorization to act as your agent") and in the one-line statement above
 * the pay button ("By paying, you agree … and authorize ReelPermit to
 * charge your credit card."). Payment itself is the assent.
 */
export const consentsSchema = z.object({
  accurateAndTerms: z.literal(true, {
    error: "Please confirm your information is accurate and agree to the Terms of Service and Privacy Policy",
  }),
});

export type Consents = z.infer<typeof consentsSchema>;

/**
 * Client-side tokenized payment handle (NMI Collect.js-style).
 *
 * PCI: the raw card number/expiry/CVV NEVER leave the customer's browser —
 * the card data is tokenized client-side and only this token reaches our
 * server. last4/brand are PCI-safe display metadata for the receipt/record.
 */
export const paymentSchema = z.object({
  token: z
    .string()
    .min(1, "Your payment session expired — please re-enter your card details"),
  last4: z
    .string()
    .regex(/^\d{4}$/, "Invalid card metadata")
    .optional(),
  brand: z.string().max(20).optional(),
  billingZip: z.string().max(10).optional(),
});

export type TokenizedPayment = z.infer<typeof paymentSchema>;

/** Full submission schema for a known state (used by the API route and the form). */
export function buildSubmissionSchema(config: StateConfig) {
  const residencyValues = config.residencyOptions.map((r) => r.value);
  const licenseIds = config.licenses.map((l) => l.id);
  const addOnIds = config.addOns.map((a) => a.id);

  return z
    .object({
      stateSlug: z.literal(config.slug),
      residency: z
        .string()
        .min(1, "Select your residency status")
        .refine((val) => residencyValues.includes(val), {
          message: "Select a valid residency status",
        }),
      licenseId: z
        .string()
        .min(1, "Select a license")
        .refine((val) => licenseIds.includes(val), { message: "Select a valid license" }),
      addOnIds: z
        .array(z.string())
        .refine((ids) => ids.every((id) => addOnIds.includes(id)), {
          message: "One or more add-ons are not valid for this state",
        })
        .default([]),
      data: buildApplicantSchema(config),
      consents: consentsSchema,
      payment: paymentSchema,
    })
    .superRefine((submission, ctx) => {
      // Conditional fields may key off wizard-level licenseId / residency.
      // Re-validate them here with full context (buildApplicantSchema only sees `data`).
      const data = submission.data as Record<string, unknown>;
      const values: Record<string, unknown> = {
        ...data,
        licenseId: submission.licenseId,
        residency: submission.residency,
      };
      for (const field of config.formFields) {
        if (!field.conditional) continue;
        if (!isFieldVisible(field, values)) continue;
        const required = isFieldEffectivelyRequired(config, field, values);
        const result = buildFieldSchema({ ...field, required }).safeParse(data[field.name]);
        if (!result.success) {
          for (const issue of result.error.issues) {
            ctx.addIssue({
              code: "custom",
              path: ["data", field.name],
              message: issue.message,
            });
          }
        }
      }
      // Florida residents must present a Florida DL/ID (DHSMV-verified residency).
      if (
        config.slug === "florida" &&
        (data.residency === "resident" || submission.residency === "resident")
      ) {
        const issuing = String(data.dlIssuingState ?? "");
        if (issuing && issuing !== "FL") {
          ctx.addIssue({
            code: "custom",
            path: ["data", "dlIssuingState"],
            message: "Florida residents must use a Florida driver license or ID",
          });
        }
      }
    });
}

export type Submission = z.infer<ReturnType<typeof buildSubmissionSchema>>;

/**
 * Generic fallback schema used by the API route when a state config file
 * does not exist yet (pre-Phase-B) — keeps the endpoint functional.
 */
export const genericSubmissionSchema = z.object({
  stateSlug: z.string().min(1),
  residency: z.string().min(1, "Select your residency status"),
  licenseId: z.string().min(1, "Select a license"),
  addOnIds: z.array(z.string()).default([]),
  data: z
    .object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      dob: z.string().min(1, "Date of birth is required"),
      email: z.string().email("Enter a valid email address"),
      phone: z.string().min(1, "Phone number is required"),
      address: z.string().min(1, "Address is required"),
      city: z.string().min(1, "City is required"),
      zip: z.string().regex(ZIP_PATTERN, "Enter a valid ZIP code"),
    })
    .passthrough(),
  consents: consentsSchema,
  payment: paymentSchema,
});

export type GenericSubmission = z.infer<typeof genericSubmissionSchema>;

/* ------------------------------------------------------------------ */
/* SSN masking utilities                                               */
/* ------------------------------------------------------------------ */

/** '123-45-6789' -> '***-**-6789'. Anything unrecognized becomes '***-**-****'. */
export function maskSSN(value: unknown): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 9) return `***-**-${digits.slice(5)}`;
  return "***-**-****";
}

/**
 * Return a copy of applicant data with every SSN-typed field masked.
 * Use before logging or emailing. Storage adapters must encrypt at rest.
 */
export function maskSensitiveFields(
  config: StateConfig | null,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const masked: Record<string, unknown> = { ...data };
  if (config) {
    for (const field of config.formFields) {
      if (field.type === "ssn" && masked[field.name] !== undefined) {
        masked[field.name] = maskSSN(masked[field.name]);
      }
    }
  } else {
    for (const key of Object.keys(masked)) {
      if (/ssn|social/i.test(key)) masked[key] = maskSSN(masked[key]);
    }
  }
  return masked;
}
