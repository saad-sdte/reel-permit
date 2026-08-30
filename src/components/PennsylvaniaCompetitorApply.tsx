"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import type { AddOn, LicenseOption, StateConfig, TokenizedPayment } from "@/lib/state-config";
import type { CheckoutStartResult, PaidResult } from "@/components/PaymentStep";
import { computeOrderTotal, itemCustomerPrice } from "@/lib/state-config";
import { US_STATE_OPTIONS } from "@/lib/us-states";
import { formatPrice } from "@/lib/format";
import { PaymentStep } from "@/components/PaymentStep";
import { PurchaseConversionBeacon } from "@/components/PurchaseConversionBeacon";
import { LicenseStartDateField } from "@/components/LicenseStartDateField";
import { isoToMmDdYyyy, localIsoDate } from "@/lib/local-date";
import { useLocale } from "@/i18n/LocaleProvider";
import {
  PA_COUNTIES,
  PA_EYE_COLORS,
  PA_HAIR_COLORS,
} from "@/data/states/pennsylvania";

/**
 * Pennsylvania competitor-apply wizard (3 steps: ID & License -> Applicant
 * Info -> Payment), mirroring the Michigan/CompetitorApplyShell pattern.
 *
 * PA specifics:
 *  - Resident path: 6 fishing licenses + 2 senior (65+) licenses.
 *  - Nonresident path: 4 annual/multi-year licenses + 3 short-term tourist.
 *  - Trout & Lake Erie permit add-ons; the Combination permit is mutually
 *    exclusive with the two individual permits. The 1-Day Tourist license
 *    already includes both permit privileges, so add-ons are hidden for it.
 *  - SSN is required (federal child-support enforcement law) — masked input.
 *  - Prices are EXACT customerPrice values from the state config (no markup).
 */

const RESIDENT_LICENSE_IDS = [
  "one-day-resident",
  "annual-resident",
  "annual-resident-combo",
  "three-year-resident",
  "five-year-resident",
  "ten-year-resident",
] as const;

const SENIOR_LICENSE_IDS = [
  "senior-annual-resident",
  "senior-lifetime-resident",
] as const;

const ANNUAL_NONRESIDENT_IDS = [
  "annual-nonresident",
  "three-year-nonresident",
  "five-year-nonresident",
  "ten-year-nonresident",
] as const;

const TOURIST_IDS = ["one-day-tourist", "three-day-tourist", "seven-day-tourist"] as const;

const SHORT_TERM_ID_SET = new Set<string>([
  "one-day-resident",
  "one-day-tourist",
  "three-day-tourist",
  "seven-day-tourist",
]);

/** Licenses whose official privileges already include Trout + Lake Erie permits. */
const PERMITS_INCLUDED_SET = new Set<string>(["one-day-tourist", "annual-resident-combo"]);

const COMBO_ADDON_ID = "combo-trout-lake-erie";

const ID_COUNTRIES = [
  "United States",
  "Canada",
  "Mexico",
  "United Kingdom",
  "Germany",
  "France",
  "Australia",
  "Japan",
  "Brazil",
  "India",
  "China",
  "South Korea",
  "Italy",
  "Spain",
  "Netherlands",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Switzerland",
  "Other",
];

/** Competitor issuing-state order: PA pinned first with separator, DC last. */
const PA_STATE_OPTIONS = [
  ...US_STATE_OPTIONS.filter((s) => s.value === "PA"),
  ...US_STATE_OPTIONS.filter((s) => s.value !== "PA" && s.value !== "DC"),
  ...US_STATE_OPTIONS.filter((s) => s.value === "DC"),
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type IdKind = "drivers-license" | "personal-id";
type Step = 0 | 1 | 2;

type FormState = {
  residency: string;
  idKind: IdKind | "";
  idNumber: string;
  idCountry: string;
  issuingState: string;
  licenseId: string;
  addOnIds: string[];
  licenseStartDate: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  email: string;
  phone: string;
  ssn: string;
  gender: string;
  heightFt: string;
  heightIn: string;
  weightPounds: string;
  hairColor: string;
  eyeColor: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  consent: boolean;
};

const INITIAL: FormState = {
  residency: "",
  idKind: "",
  idNumber: "",
  idCountry: "United States",
  issuingState: "PA",
  licenseId: "",
  addOnIds: [],
  licenseStartDate: "",
  firstName: "",
  middleName: "",
  lastName: "",
  dobDay: "",
  dobMonth: "",
  dobYear: "",
  email: "",
  phone: "",
  ssn: "",
  gender: "",
  heightFt: "",
  heightIn: "",
  weightPounds: "",
  hairColor: "",
  eyeColor: "",
  street: "",
  city: "",
  state: "PA",
  zip: "",
  county: "",
  consent: false,
};

const inputClass =
  "form-input w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-navy focus:ring-1 focus:ring-navy";

function pad2(n: string | number) {
  return String(n).padStart(2, "0");
}

function monthIndex(name: string): number {
  return MONTHS.indexOf(name) + 1;
}

function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

function formatPhone(raw: string): string {
  const d = digitsOnly(raw);
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return raw.trim();
}

/** Live SSN input mask: digits -> 123-45-6789. */
function formatSsn(raw: string): string {
  const d = digitsOnly(raw).slice(0, 9);
  if (d.length > 5) return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
  if (d.length > 3) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return d;
}

function toPaStateName(code: string): string {
  const opt = US_STATE_OPTIONS.find((s) => s.value === code);
  return (opt?.label ?? "Pennsylvania").toUpperCase();
}

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "min-w-0 flex-1 rounded border-2 px-3 py-3 text-center text-sm font-semibold transition-colors",
        selected
          ? "border-navy bg-navy/10 text-navy"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  required,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-8 border-t border-slate-100 pt-6 text-base font-bold uppercase tracking-wide text-slate-800">
      {children}
    </h2>
  );
}

function LicenseCard({
  lic,
  selected,
  onSelect,
}: {
  lic: LicenseOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "flex w-full items-center justify-between gap-3 rounded border px-3 py-3 text-left text-sm transition-colors",
        selected
          ? "border-navy bg-navy/5 ring-1 ring-navy"
          : "border-slate-200 bg-white hover:border-slate-300",
      ].join(" ")}
    >
      <span>
        <span className="block font-medium text-slate-800">{lic.name}</span>
        {lic.description && (
          <span className="block text-xs text-slate-500">{lic.description}</span>
        )}
      </span>
      <span className="shrink-0 font-bold text-navy">
        {formatPrice(itemCustomerPrice(lic))}
      </span>
    </button>
  );
}

function AddOnCard({
  addOn,
  selected,
  onToggle,
}: {
  addOn: AddOn;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={[
        "flex w-full items-center justify-between gap-3 rounded border px-3 py-3 text-left text-sm transition-colors",
        selected
          ? "border-forest-600 bg-forest-50 ring-1 ring-forest-600"
          : "border-slate-200 bg-white hover:border-slate-300",
      ].join(" ")}
    >
      <span className="flex items-start gap-2.5">
        <span
          className={[
            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px]",
            selected
              ? "border-forest-600 bg-forest-600 text-white"
              : "border-slate-300 bg-white text-transparent",
          ].join(" ")}
          aria-hidden="true"
        >
          {selected && <Check className="h-3 w-3" strokeWidth={3.5} />}
        </span>
        <span>
          <span className="block font-medium text-slate-800">{addOn.name}</span>
          {addOn.description && (
            <span className="block text-xs text-slate-500">{addOn.description}</span>
          )}
        </span>
      </span>
      <span className="shrink-0 font-bold text-navy">
        {formatPrice(itemCustomerPrice(addOn))}
      </span>
    </button>
  );
}

export function PennsylvaniaCompetitorApply({ config }: { config: StateConfig }) {
  const { t } = useLocale();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<string[]>([]);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  // Focused checkout: past license selection (step >= 1) hide the global site
  // footer via a body class until payment completes — same as the other
  // competitor wizards. Restored on unmount and on returning to step 0.
  useEffect(() => {
    const active = step >= 1 && !reference;
    document.body.classList.toggle("wizard-active", active);
    return () => document.body.classList.remove("wizard-active");
  }, [step, reference]);
  const [conversionValue, setConversionValue] = useState(1);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [showConsentTerms, setShowConsentTerms] = useState(false);
  const applicationIdRef = useRef<string | null>(null);
  const promoCodeRef = useRef<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const isResident = form.residency === "resident";

  const licensesByIds = useMemo(
    () => (ids: readonly string[]) =>
      ids
        .map((id) => config.licenses.find((l) => l.id === id))
        .filter((l): l is LicenseOption => Boolean(l)),
    [config.licenses],
  );

  const residentLicenses = isResident ? licensesByIds(RESIDENT_LICENSE_IDS) : [];
  const seniorLicenses = isResident ? licensesByIds(SENIOR_LICENSE_IDS) : [];
  const annualNonresidentLicenses =
    !isResident && form.residency ? licensesByIds(ANNUAL_NONRESIDENT_IDS) : [];
  const touristLicenses = !isResident && form.residency ? licensesByIds(TOURIST_IDS) : [];

  const selectedLicense = config.licenses.find((l) => l.id === form.licenseId);
  const selectedAddOns = form.addOnIds
    .map((id) => config.addOns.find((a) => a.id === id))
    .filter((a): a is AddOn => Boolean(a));
  const total = form.licenseId
    ? computeOrderTotal(config, form.licenseId, form.addOnIds)
    : 0;
  const isShortTerm = SHORT_TERM_ID_SET.has(form.licenseId);
  const permitsIncluded = PERMITS_INCLUDED_SET.has(form.licenseId);

  function selectResidency(value: string) {
    setForm((f) => ({
      ...f,
      residency: value,
      licenseId: "",
      addOnIds: [],
      licenseStartDate: "",
      idCountry: value === "nonresident" ? f.idCountry || "United States" : "United States",
      issuingState: value === "resident" ? "PA" : f.issuingState === "PA" ? "" : f.issuingState,
      state: value === "resident" ? "PA" : f.state || "PA",
      idKind: f.idKind,
    }));
    setErrors([]);
  }

  function selectLicense(id: string) {
    setForm((f) => ({
      ...f,
      licenseId: id,
      // The 1-Day Tourist license already includes both permits — drop add-ons.
      addOnIds: PERMITS_INCLUDED_SET.has(id) ? [] : f.addOnIds,
      licenseStartDate: SHORT_TERM_ID_SET.has(id) ? f.licenseStartDate || localIsoDate() : "",
    }));
  }

  /** Combination permit replaces the two individual permits, and vice versa. */
  function toggleAddOn(id: string) {
    setForm((f) => {
      if (f.addOnIds.includes(id)) {
        return { ...f, addOnIds: f.addOnIds.filter((x) => x !== id) };
      }
      if (id === COMBO_ADDON_ID) {
        return { ...f, addOnIds: [COMBO_ADDON_ID] };
      }
      return {
        ...f,
        addOnIds: [...f.addOnIds.filter((x) => x !== COMBO_ADDON_ID), id],
      };
    });
  }

  function validateStep0(): string[] {
    const e: string[] = [];
    if (!form.residency) e.push("Select whether you are a Pennsylvania resident.");
    if (!form.idKind) e.push("Select an identification type.");
    if (!form.idNumber.trim()) e.push("Enter your identification number.");
    if (!isResident && !form.idCountry) e.push("Select the issuing country.");
    if (!form.issuingState) e.push("Select the issuing state.");
    if (!form.licenseId) e.push("Select a license.");
    if (isShortTerm && !form.licenseStartDate) {
      e.push("Choose a license start date.");
    }
    return e;
  }

  function validateStep1(): string[] {
    const e: string[] = [];
    if (!form.firstName.trim()) e.push("First name is required.");
    if (!form.lastName.trim()) e.push("Last name is required.");
    if (!form.dobDay || !form.dobMonth || !form.dobYear) e.push("Date of birth is required.");
    if (!form.email.trim() || !form.email.includes("@")) e.push("Email address is required.");
    if (!/^\d{3}-\d{2}-\d{4}$/.test(form.ssn.trim())) {
      e.push("Enter your Social Security number as 123-45-6789.");
    }
    if (!form.gender) e.push("Gender is required.");
    if (!form.heightFt || form.heightIn === "") e.push("Height is required.");
    if (!form.weightPounds.trim() || Number(form.weightPounds) < 1) {
      e.push("Weight is required.");
    }
    if (!form.hairColor) e.push("Hair color is required.");
    if (!form.eyeColor) e.push("Eye color is required.");
    if (!form.street.trim()) e.push("Street address is required.");
    if (!form.city.trim()) e.push("City is required.");
    if (!form.state) e.push("State is required.");
    if (!form.zip.trim()) e.push("ZIP code is required.");
    else if (!/^\d{5}(-\d{4})?$/.test(form.zip.trim())) {
      e.push("Enter a valid ZIP code.");
    }
    if (!form.county) e.push("County is required.");
    if (!form.consent) e.push("Please confirm your information and agree to the terms.");
    return e;
  }

  function genderToPortal(g: string): string {
    if (g === "male") return "MALE";
    if (g === "female") return "FEMALE";
    if (g === "non-binary") return "NON-BINARY";
    return "OTHER";
  }

  function buildPayload(payment?: TokenizedPayment) {
    const dob = `${pad2(monthIndex(form.dobMonth))}/${pad2(form.dobDay)}/${form.dobYear}`;
    const data: Record<string, string | boolean | number> = {
      idType:
        form.idKind === "drivers-license" ? "Driver's License/State ID" : "Personal ID Card",
      idNumber: form.idNumber.trim(),
      driversLicenseState: toPaStateName(form.issuingState),
      idCountry: form.idCountry,
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
      lastName: form.lastName.trim(),
      dateOfBirth: dob,
      ssn: form.ssn.trim(), // masked via maskSensitiveFields() in every log/notification
      gender: genderToPortal(form.gender),
      heightFt: form.heightFt,
      heightIn: form.heightIn,
      weightPounds: Number(form.weightPounds),
      hairColor: form.hairColor,
      eyeColor: form.eyeColor,
      email: form.email.trim(),
      primaryPhone: form.phone.trim() ? formatPhone(form.phone) : "",
      resStreet1: form.street.trim(),
      resCity: form.city.trim(),
      resState: toPaStateName(form.state || (isResident ? "PA" : form.issuingState || "PA")),
      resZip: form.zip.trim(),
      county: form.county,
      resCountry:
        !isResident && form.idCountry && form.idCountry !== "United States"
          ? form.idCountry.toUpperCase()
          : "UNITED STATES",
      pennsylvaniaResident: isResident ? "Yes" : "No",
    };
    if (isShortTerm && form.licenseStartDate) {
      data.licenseStartDate = isoToMmDdYyyy(form.licenseStartDate);
    }
    return {
      stateSlug: config.slug,
      residency: form.residency,
      licenseId: form.licenseId,
      addOnIds: [...form.addOnIds],
      data,
      consents: { accurateAndTerms: true as const },
      ...(payment ? { payment } : {}),
      ...(applicationIdRef.current ? { applicationId: applicationIdRef.current } : {}),
      ...(promoCodeRef.current ? { promoCode: promoCodeRef.current } : {}),
    };
  }

  async function startCheckout(promoCode?: string | null): Promise<CheckoutStartResult> {
    promoCodeRef.current = promoCode ?? null;
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const json = (await res.json()) as CheckoutStartResult;
      if (json.applicationId) applicationIdRef.current = json.applicationId;
      if (!res.ok && !json.useLocalCard && !json.awaitingPayment) {
        return { ok: false, message: json.message ?? "Payment could not be started. Please try again." };
      }
      return json;
    } catch {
      return { ok: false, message: "We could not reach the server. Check your connection and try again." };
    }
  }

  function handlePaid(result: PaidResult) {
    applicationIdRef.current = null;
    setConversionValue(typeof result.amount === "number" ? result.amount : total);
    setReference(result.reference);
    setConfirmationEmail(result.email ?? form.email.trim() ?? null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handlePay(payment: TokenizedPayment, promoCode?: string | null) {
    promoCodeRef.current = promoCode ?? null;
    setProcessing(true);
    setPaymentError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(payment)),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        reference?: string;
        applicationId?: string | null;
        confirmationEmailedTo?: string | null;
        amount?: number;
        message?: string;
        errors?: Record<string, string[]>;
      };
      if (res.ok && json.ok && json.reference) {
        applicationIdRef.current = null;
        setConversionValue(
          typeof json.amount === "number" && json.amount > 0 ? json.amount : total,
        );
        setReference(json.reference);
        setConfirmationEmail(json.confirmationEmailedTo ?? null);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (res.status === 402) {
        if (json.applicationId) applicationIdRef.current = json.applicationId;
        setPaymentError(
          json.message ?? "Your payment could not be completed. Please try a different card.",
        );
        return;
      }
      const detail = json.errors
        ? Object.values(json.errors).flat().slice(0, 3).join(" ")
        : "";
      setPaymentError(
        [json.message ?? "Something went wrong while submitting. Please try again.", detail]
          .filter(Boolean)
          .join(" "),
      );
    } catch {
      setPaymentError("We could not reach the server. Check your connection and try again.");
    } finally {
      setProcessing(false);
    }
  }

  if (reference) {
    return (
      <div className="mx-auto max-w-xl rounded border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
        <PurchaseConversionBeacon transactionId={reference} value={conversionValue} />
        <h2 className="text-2xl font-bold text-navy">{t("wizard.applicationReceived")}</h2>
        <p className="mt-2 text-slate-600">
          Thank you — your Pennsylvania fishing license application and payment have been received.
        </p>
        <div className="mt-6 rounded border border-navy/10 bg-slate-50 px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {t("wizard.referenceNumber")}
          </p>
          <p className="mt-1 font-mono text-xl font-bold text-navy">{reference}</p>
        </div>
        {confirmationEmail && (
          <p className="mt-4 text-sm text-slate-600">
            {t("wizard.confirmationEmail")}{" "}
            <span className="font-semibold text-navy">{confirmationEmail}</span>.
          </p>
        )}
      </div>
    );
  }

  const steps = [
    t("wizard.idLicense"),
    t("wizard.applicantInfo"),
    t("wizard.payment"),
  ] as const;
  const idNumberLabel =
    form.idKind === "drivers-license" ? "Driver's License Number" : "Personal ID Number";

  const paResidencyLabel = (value: string) => {
    if (value === "resident") return t("pa.yesResident");
    if (value === "nonresident") return t("pa.noNonResident");
    return config.residencyOptions.find((o) => o.value === value)?.label ?? value;
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-6 flex items-center justify-center gap-3">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                  i <= step ? "bg-navy text-white" : "bg-slate-200 text-slate-500",
                ].join(" ")}
              >
                {i + 1}
              </div>
              <span
                className={`max-w-[5.5rem] text-center text-xs ${
                  i <= step ? "font-medium text-slate-800" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && <div className="mb-4 h-px w-8 bg-slate-200 sm:w-10" />}
          </div>
        ))}
      </div>

      <div className="rounded border border-slate-200 bg-white px-4 py-6 shadow-sm sm:px-6">
        {errors.length > 0 && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <ul className="list-disc pl-4">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {step === 0 && (
          <>
            <h2 className="text-xl font-bold text-slate-900">{t("pa.step0Title")}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("pa.step0Sub")}</p>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-800">
                {t("pa.areYouResident")} <span className="text-red-600">*</span>
              </p>
              <div className="mt-2 flex w-full flex-row gap-2">
                {config.residencyOptions.map((opt) => (
                  <ChoiceButton
                    key={opt.value}
                    selected={form.residency === opt.value}
                    onClick={() => selectResidency(opt.value)}
                  >
                    {paResidencyLabel(opt.value)}
                  </ChoiceButton>
                ))}
              </div>
            </div>

            {form.residency && (
              <>
                <div className="mt-6">
                  <p className="text-sm font-semibold text-slate-800">
                    {t("wizard.idType")} <span className="text-red-600">*</span>
                  </p>
                  <div className="mt-2 flex w-full flex-row gap-2">
                    <ChoiceButton
                      selected={form.idKind === "drivers-license"}
                      onClick={() => set("idKind", "drivers-license")}
                    >
                      {t("wizard.driversLicense")}
                    </ChoiceButton>
                    <ChoiceButton
                      selected={form.idKind === "personal-id"}
                      onClick={() => set("idKind", "personal-id")}
                    >
                      {t("wizard.personalId")}
                    </ChoiceButton>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <Field label={idNumberLabel} required>
                    <input
                      className={inputClass}
                      placeholder={t("wizard.enterIdNumber")}
                      value={form.idNumber}
                      onChange={(e) => set("idNumber", e.target.value)}
                    />
                  </Field>
                  {!isResident && (
                    <Field label={t("wizard.country")} required>
                      <select
                        className={inputClass}
                        value={form.idCountry}
                        onChange={(e) => set("idCountry", e.target.value)}
                      >
                        {ID_COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                  <Field label={t("wizard.issuingState")} required>
                    <select
                      className={inputClass}
                      value={form.issuingState}
                      onChange={(e) => set("issuingState", e.target.value)}
                    >
                      <option value="">{t("wizard.selectIssuingState")}</option>
                      <option value="PA">PA — Pennsylvania</option>
                      <option disabled>──────────</option>
                      {PA_STATE_OPTIONS.filter((s) => s.value !== "PA").map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.value}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div
                  className={[
                    "mt-4 rounded border px-3 py-2 text-sm",
                    isResident
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-amber-200 bg-amber-50 text-amber-900",
                  ].join(" ")}
                >
                  {isResident
                    ? t("pa.residentBanner")
                    : "You are a Non-Resident of Pennsylvania"}
                </div>

                {isResident && (
                  <>
                    <SectionHeading>{t("wizard.fishingLicenses")}</SectionHeading>
                    <div className="mt-3 space-y-2">
                      {residentLicenses.map((lic) => (
                        <LicenseCard
                          key={lic.id}
                          lic={lic}
                          selected={form.licenseId === lic.id}
                          onSelect={() => selectLicense(lic.id)}
                        />
                      ))}
                    </div>
                    <SectionHeading>Senior Licenses (65+)</SectionHeading>
                    <div className="mt-3 space-y-2">
                      {seniorLicenses.map((lic) => (
                        <LicenseCard
                          key={lic.id}
                          lic={lic}
                          selected={form.licenseId === lic.id}
                          onSelect={() => selectLicense(lic.id)}
                        />
                      ))}
                    </div>
                  </>
                )}

                {!isResident && (
                  <>
                    <SectionHeading>{t("wizard.fishingLicenses")}</SectionHeading>
                    <div className="mt-3 space-y-2">
                      {annualNonresidentLicenses.map((lic) => (
                        <LicenseCard
                          key={lic.id}
                          lic={lic}
                          selected={form.licenseId === lic.id}
                          onSelect={() => selectLicense(lic.id)}
                        />
                      ))}
                    </div>
                    <SectionHeading>{t("wizard.shortTermLicenses")}</SectionHeading>
                    <div className="mt-3 space-y-2">
                      {touristLicenses.map((lic) => (
                        <LicenseCard
                          key={lic.id}
                          lic={lic}
                          selected={form.licenseId === lic.id}
                          onSelect={() => selectLicense(lic.id)}
                        />
                      ))}
                    </div>
                  </>
                )}

                {isShortTerm && (
                  <LicenseStartDateField
                    value={form.licenseStartDate}
                    onChange={(v) => set("licenseStartDate", v)}
                    inputClassName={inputClass}
                  />
                )}

                {form.licenseId && (
                  <>
                    <SectionHeading>Trout &amp; Lake Erie Permits</SectionHeading>
                    {permitsIncluded ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Your 1-Day Tourist License already includes Trout and Lake Erie
                        permit privileges — no separate permit is needed.
                      </p>
                    ) : (
                      <>
                        <p className="mt-2 text-xs text-slate-500">
                          Add the permits you need. A Trout Permit is required to fish for
                          or possess trout; a Lake Erie Permit is required for Lake Erie,
                          Presque Isle Bay and their tributaries.
                        </p>
                        <div className="mt-3 space-y-2">
                          {config.addOns.map((addOn) => (
                            <AddOnCard
                              key={addOn.id}
                              addOn={addOn}
                              selected={form.addOnIds.includes(addOn.id)}
                              onToggle={() => toggleAddOn(addOn.id)}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            <button
              type="button"
              className="mt-8 w-full rounded bg-navy px-4 py-3 text-sm font-semibold text-white hover:bg-navy/90"
              onClick={() => {
                const e = validateStep0();
                setErrors(e);
                if (e.length === 0) {
                  setStep(1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            >
              {t("wizard.continueShort")}
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-xl font-bold text-slate-900">{t("wizard.applicantInfo")}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Provide your personal details and demographics.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Field label={t("wizard.firstName")} required>
                <input
                  className={inputClass}
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                />
              </Field>
              <Field label={t("wizard.middleName")}>
                <input
                  className={inputClass}
                  value={form.middleName}
                  onChange={(e) => set("middleName", e.target.value)}
                />
              </Field>
              <Field label={t("wizard.lastName")} required>
                <input
                  className={inputClass}
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                />
              </Field>
            </div>

            <Field label={t("wizard.dob")} required className="mt-3">
              <div className="grid grid-cols-3 gap-2">
                <select
                  className={inputClass}
                  value={form.dobMonth}
                  onChange={(e) => set("dobMonth", e.target.value)}
                >
                  <option value="">{t("wizard.month")}</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {t(`month.${m}`)}
                    </option>
                  ))}
                </select>
                <select
                  className={inputClass}
                  value={form.dobDay}
                  onChange={(e) => set("dobDay", e.target.value)}
                >
                  <option value="">{t("wizard.day")}</option>
                  {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <select
                  className={inputClass}
                  value={form.dobYear}
                  onChange={(e) => set("dobYear", e.target.value)}
                >
                  <option value="">{t("wizard.year")}</option>
                  {Array.from({ length: 100 }, (_, i) => String(2026 - i)).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </Field>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label={t("wizard.email")} required>
                <input
                  className={inputClass}
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
              <Field label={t("wizard.phone")}>
                <input
                  className={inputClass}
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label={t("wizard.ssn")} required>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  placeholder="123-45-6789"
                  autoComplete="off"
                  value={form.ssn}
                  onChange={(e) => set("ssn", formatSsn(e.target.value))}
                />
              </Field>
              <p className="mt-1.5 text-xs text-slate-500">
                Pennsylvania requires an SSN from all license buyers under federal and
                state child-support enforcement law. Your SSN is transmitted encrypted and
                is masked in all notifications after submission.
              </p>
            </div>

            <SectionHeading>{t("wizard.demographics")}</SectionHeading>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label={t("wizard.gender")} required className="sm:col-span-2">
                <select
                  className={inputClass}
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                >
                  <option value="">{t("wizard.selectGender")}</option>
                  <option value="male">{t("wizard.male")}</option>
                  <option value="female">{t("wizard.female")}</option>
                  <option value="non-binary">{t("wizard.nonBinary")}</option>
                  <option value="prefer-not">{t("wizard.preferNot")}</option>
                </select>
              </Field>
              <Field label={t("wizard.heightFt")} required>
                <select
                  className={inputClass}
                  value={form.heightFt}
                  onChange={(e) => set("heightFt", e.target.value)}
                >
                  <option value="">Ft</option>
                  {["3", "4", "5", "6", "7"].map((ft) => (
                    <option key={ft} value={ft}>
                      {ft}&apos;
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("wizard.heightIn")} required>
                <select
                  className={inputClass}
                  value={form.heightIn}
                  onChange={(e) => set("heightIn", e.target.value)}
                >
                  <option value="">In</option>
                  {Array.from({ length: 12 }, (_, i) => String(i)).map((inch) => (
                    <option key={inch} value={inch}>
                      {inch}&quot;
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("wizard.weight")} required className="sm:col-span-2">
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  max={999}
                  inputMode="numeric"
                  value={form.weightPounds}
                  onChange={(e) => set("weightPounds", digitsOnly(e.target.value).slice(0, 3))}
                />
              </Field>
              <Field label={t("wizard.hairColor")} required>
                <select
                  className={inputClass}
                  value={form.hairColor}
                  onChange={(e) => set("hairColor", e.target.value)}
                >
                  <option value="">{t("wizard.selectHairColor")}</option>
                  {PA_HAIR_COLORS.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("wizard.eyeColor")} required>
                <select
                  className={inputClass}
                  value={form.eyeColor}
                  onChange={(e) => set("eyeColor", e.target.value)}
                >
                  <option value="">{t("wizard.selectEyeColor")}</option>
                  {PA_EYE_COLORS.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <SectionHeading>{t("wizard.residentialAddress")}</SectionHeading>
            <div className="mt-3 grid gap-3">
              <Field label={t("wizard.street")} required>
                <input
                  className={inputClass}
                  value={form.street}
                  onChange={(e) => set("street", e.target.value)}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label={t("wizard.city")} required>
                  <input
                    className={inputClass}
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                  />
                </Field>
                <Field label={t("wizard.state")} required>
                  <select
                    className={inputClass}
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                  >
                    <option value="">{t("wizard.selectState")}</option>
                    {PA_STATE_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.value === "PA" ? "PA — Pennsylvania" : s.value}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("wizard.zip")} required>
                  <input
                    className={inputClass}
                    value={form.zip}
                    onChange={(e) => set("zip", e.target.value)}
                  />
                </Field>
              </div>
              <Field label={t("wizard.county")} required>
                <select
                  className={inputClass}
                  value={form.county}
                  onChange={(e) => set("county", e.target.value)}
                >
                  <option value="">{t("wizard.selectCounty")}</option>
                  {PA_COUNTIES.map((county) => (
                    <option key={county} value={county}>
                      {county}
                    </option>
                  ))}
                  <option value="Out of State">Out of State</option>
                </select>
              </Field>
            </div>

            <div className="mt-6">
              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={form.consent}
                  onChange={(e) => set("consent", e.target.checked)}
                />
                <span>
                  {t("wizard.consent")} <span className="text-red-600">*</span>{" "}
                  <button
                    type="button"
                    className="font-semibold text-navy underline"
                    onClick={() => setShowConsentTerms((v) => !v)}
                  >
                    {showConsentTerms ? t("wizard.showLess") : t("wizard.readMore")}
                  </button>
                </span>
              </label>
              {showConsentTerms && (
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  By submitting, you authorize ReelPermit to assist with your
                  Pennsylvania fishing license application and to process payment for the
                  selected license and permits.
                </p>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                className="rounded border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setStep(0);
                  setErrors([]);
                }}
              >
                {t("wizard.backShort")}
              </button>
              <button
                type="button"
                className="flex-1 rounded bg-navy px-4 py-3 text-sm font-semibold text-white hover:bg-navy/90"
                onClick={() => {
                  const e = validateStep1();
                  setErrors(e);
                  if (e.length === 0) {
                    setStep(2);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              >
                {t("wizard.completeOrder")}
              </button>
            </div>
          </>
        )}

        {step === 2 && selectedLicense && (
          <>
            <h2 className="text-xl font-bold text-slate-900">{t("wizard.payment")}</h2>
            <div className="mt-4">
              {/* Itemized order summary: license + permits + bundled total. */}
              <div className="mb-5 rounded border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Selected License
                </p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedLicense.name}
                  </p>
                  <p className="text-lg font-bold text-navy">
                    {formatPrice(itemCustomerPrice(selectedLicense))}
                  </p>
                </div>
                {selectedAddOns.map((addOn) => (
                  <div
                    key={addOn.id}
                    className="mt-1 flex items-center justify-between gap-3"
                  >
                    <p className="text-sm font-medium text-slate-600">{addOn.name}</p>
                    <p className="text-sm font-semibold text-navy">
                      {formatPrice(itemCustomerPrice(addOn))}
                    </p>
                  </div>
                ))}
                {selectedAddOns.length > 0 && (
                  <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-200 pt-2">
                    <p className="text-sm font-semibold text-slate-800">Total</p>
                    <p className="text-lg font-bold text-navy">{formatPrice(total)}</p>
                  </div>
                )}
              </div>
              <PaymentStep
                total={total}
                stateName={config.stateName}
                processing={processing}
                error={paymentError}
                onPay={handlePay}
                onStartCheckout={startCheckout}
                onPaid={handlePaid}
                applicantEmail={form.email.trim()}
                compact
                licenseSummary={{
                  name: selectedLicense.name,
                  price: itemCustomerPrice(selectedLicense),
                }}
              />
              <button
                type="button"
                className="mt-4 w-full rounded border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setStep(1);
                  setPaymentError(null);
                }}
              >
                {t("wizard.backShort")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
