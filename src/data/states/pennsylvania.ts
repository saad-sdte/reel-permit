import type { FieldOption, StateConfig } from "@/lib/state-config";
import { US_STATE_OPTIONS } from "@/lib/us-states";

/**
 * ============================================================================
 * PENNSYLVANIA — src/data/states/pennsylvania.ts
 * ----------------------------------------------------------------------------
 * Base prices are the official 2026 PFBC fees, verified 2026-08-26 against
 * pa.gov/agencies/fishandboat/fishing/buy-fishing-license-permit, the official
 * eRegulations digest, and the PFBC 2026-licenses launch press release.
 *  - Official agency:  Pennsylvania Fish and Boat Commission (PFBC)
 *  - Official portal:  HuntFishPA — https://huntfish.pa.gov/
 *  - License year: 2026 licenses valid Dec 1, 2025 – Dec 31, 2026 (up to
 *    13 months). 1-day licenses are not valid Mar 15 – Apr 30.
 *
 * Portal quirks preserved verbatim:
 *  - 1-Day Tourist and 3-Day Tourist are BOTH $31.97 on the official 2026 fee
 *    table (verified on two official sources — not a typo here).
 *  - 1-Day Tourist INCLUDES Trout + Lake Erie permit privileges; 1-Day
 *    Resident does NOT (modeled via addOns[].appliesTo excluding
 *    one-day-tourist).
 *  - PA requires an SSN for license purchase (federal child-support
 *    enforcement law) -> requiresSSN: true, masked field with explainer.
 *
 * PRICING (updated 2026-08-28): every Pennsylvania package carries an EXACT
 * `customerPrice` — the price displayed and charged everywhere in this flow
 * (cards, order summary, pay button, payment amount, CRM/order record).
 * The markup formula (displayPrice / PRICE_MARKUP) is NOT used for
 * Pennsylvania. `price` keeps the official PFBC fee, unchanged, for
 * reference/portal filing only. Other states and their pricing are unaffected.
 * One bundled total — never labeled "official fee" / "state fee".
 *
 * Multi-year Trout/Combo permits (3/5/10-yr) exist on HuntFishPA but are
 * intentionally not offered in this curated wizard — annual permits only,
 * matching the competitor-wizard curation used for the other seven states.
 * ============================================================================
 */

/**
 * Uppercase full state names (50 states + DC) — the wizard submits the full
 * name in caps (e.g. "PENNSYLVANIA"), matching the HuntFishPA portal format.
 */
const upperStateOptions: FieldOption[] = US_STATE_OPTIONS.map((s) => ({
  value: s.label.toUpperCase(),
  label: s.label.toUpperCase(),
}));

/** ID-issuing country list offered to non-residents (wizard order). */
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

const idCountryOptions: FieldOption[] = ID_COUNTRIES.map((c) => ({
  value: c,
  label: c,
}));

/** Residence country is submitted in caps ("UNITED STATES", "CANADA", …). */
const resCountryOptions: FieldOption[] = ID_COUNTRIES.map((c) => ({
  value: c.toUpperCase(),
  label: c.toUpperCase(),
}));

/** Licenses that require a start date (day-based validity). */
export const PA_SHORT_TERM_IDS = [
  "one-day-resident",
  "one-day-tourist",
  "three-day-tourist",
  "seven-day-tourist",
] as const;

/** Licenses whose official privileges already include Trout + Lake Erie permits. */
export const PA_PERMITS_INCLUDED_IDS = ["one-day-tourist", "annual-resident-combo"] as const;

/** Pennsylvania's 67 counties — HuntFishPA county-of-residence dropdown. */
export const PA_COUNTIES = [
  "Adams",
  "Allegheny",
  "Armstrong",
  "Beaver",
  "Bedford",
  "Berks",
  "Blair",
  "Bradford",
  "Bucks",
  "Butler",
  "Cambria",
  "Cameron",
  "Carbon",
  "Centre",
  "Chester",
  "Clarion",
  "Clearfield",
  "Clinton",
  "Columbia",
  "Crawford",
  "Cumberland",
  "Dauphin",
  "Delaware",
  "Elk",
  "Erie",
  "Fayette",
  "Forest",
  "Franklin",
  "Fulton",
  "Greene",
  "Huntingdon",
  "Indiana",
  "Jefferson",
  "Juniata",
  "Lackawanna",
  "Lancaster",
  "Lawrence",
  "Lebanon",
  "Lehigh",
  "Luzerne",
  "Lycoming",
  "McKean",
  "Mercer",
  "Mifflin",
  "Monroe",
  "Montgomery",
  "Montour",
  "Northampton",
  "Northumberland",
  "Perry",
  "Philadelphia",
  "Pike",
  "Potter",
  "Schuylkill",
  "Snyder",
  "Somerset",
  "Sullivan",
  "Susquehanna",
  "Tioga",
  "Union",
  "Venango",
  "Warren",
  "Washington",
  "Wayne",
  "Westmoreland",
  "Wyoming",
  "York",
] as const;

const countyOptions: FieldOption[] = [
  ...PA_COUNTIES.map((c) => ({ value: c, label: c })),
  { value: "Out of State", label: "Out of State" },
];

/** Identifying-characteristics options on the HuntFishPA profile. */
export const PA_HAIR_COLORS = [
  "Bald",
  "Black",
  "Blonde",
  "Brown",
  "Gray",
  "White",
  "Sandy",
  "Red/Auburn",
  "Other",
] as const;

export const PA_EYE_COLORS = [
  "Blue",
  "Brown",
  "Green",
  "Pink",
  "Black",
  "Gray",
  "Hazel",
  "Other",
] as const;

const hairColorOptions: FieldOption[] = PA_HAIR_COLORS.map((c) => ({
  value: c,
  label: c,
}));

const eyeColorOptions: FieldOption[] = PA_EYE_COLORS.map((c) => ({
  value: c,
  label: c,
}));

/** Every license id EXCEPT one-day-tourist (whose privileges include the permits). */
const PERMIT_APPLIES_TO = [
  "one-day-resident",
  "annual-resident",
  "three-year-resident",
  "five-year-resident",
  "ten-year-resident",
  "senior-annual-resident",
  "senior-lifetime-resident",
  "annual-nonresident",
  "three-year-nonresident",
  "five-year-nonresident",
  "ten-year-nonresident",
  "three-day-tourist",
  "seven-day-tourist",
];

export const config: StateConfig = {
  slug: "pennsylvania",
  stateName: "Pennsylvania",
  officialAgencyName: "Pennsylvania Fish and Boat Commission",
  officialPortalName: "HuntFishPA",
  officialPortalUrl: "https://huntfish.pa.gov/",
  lastVerified: "2026-08-26",
  requiresSSN: true,
  ssnExplainer:
    "Pennsylvania requires a Social Security number to buy a fishing license under federal child-support enforcement law (the PFBC licensing FAQ cites the federal welfare-reform mandate).",
  licenseYearNote:
    "2026 annual licenses and permits are valid Dec 1, 2025 through Dec 31, 2026 (up to 13 months). 1-day licenses are not valid Mar 15 - Apr 30.",
  residencyOptions: [
    { value: "resident", label: "Yes, PA Resident" },
    { value: "nonresident", label: "No, Non-Resident" },
  ],
  licenses: [
    /* Resident */
    {
      id: "one-day-resident",
      name: "1-Day Resident License",
      price: 14.47,
      customerPrice: 49.99,
      residency: "resident",
      duration: "1-Day",
      category: "all-water",
      description: "Not valid Mar 15 – Apr 30 · permits not included",
      officialNote:
        "Official 2026 PFBC fee $14.47 per pa.gov buy-fishing-license-permit page and eRegulations digest. 1-Day Resident does NOT include Trout/Lake Erie permit privileges.",
    },
    {
      id: "annual-resident",
      name: "Resident Annual License",
      price: 27.97,
      customerPrice: 69.92,
      residency: "resident",
      duration: "Annual",
      category: "all-water",
      description: "Valid to 12/31/2026",
      officialNote: "Official 2026 PFBC fee $27.97.",
    },
    {
      id: "annual-resident-combo",
      name: "Resident Annual Combination License",
      price: 48.94,
      customerPrice: 146.23,
      residency: "resident",
      duration: "Annual",
      category: "combo",
      description: "Includes Trout & Lake Erie permits · Valid to 12/31/2026",
      officialNote:
        "Bundled customer price $146.23. Official 2026 PFBC fees: Resident Annual $27.97 + Combination Trout/Lake Erie Permit $20.97.",
    },
    {
      id: "three-year-resident",
      name: "3-Year Resident License",
      price: 79.97,
      customerPrice: 149.95,
      residency: "resident",
      duration: "3-Year",
      category: "all-water",
      description: "Valid to 12/31/2028",
      officialNote: "Official 2026 PFBC fee $79.97.",
    },
    {
      id: "five-year-resident",
      name: "5-Year Resident License",
      price: 131.97,
      customerPrice: 249.95,
      residency: "resident",
      duration: "5-Year",
      category: "all-water",
      description: "Valid to 12/31/2030",
      officialNote: "Official 2026 PFBC fee $131.97.",
    },
    {
      id: "ten-year-resident",
      name: "10-Year Resident License",
      price: 261.97,
      customerPrice: 449.95,
      residency: "resident",
      duration: "10-Year",
      category: "all-water",
      description: "Valid to 12/31/2035",
      officialNote: "Official 2026 PFBC fee $261.97.",
    },
    /* Senior residents (65+) */
    {
      id: "senior-annual-resident",
      name: "Senior Resident Annual License (65+)",
      price: 14.47,
      customerPrice: 49.99,
      residency: "senior",
      duration: "Annual",
      category: "all-water",
      description: "PA residents 65+ · Valid to 12/31/2026",
      officialNote: "Official 2026 PFBC fee $14.47.",
    },
    {
      id: "senior-lifetime-resident",
      name: "Senior Resident Lifetime License (65+)",
      price: 86.97,
      customerPrice: 174.95,
      residency: "senior",
      duration: "Lifetime",
      category: "all-water",
      description: "PA residents 65+ · Valid for your lifetime",
      officialNote: "Official 2026 PFBC fee $86.97.",
    },
    /* Non-resident */
    {
      id: "annual-nonresident",
      name: "Non-Resident Annual License",
      price: 60.97,
      customerPrice: 99.95,
      residency: "nonresident",
      duration: "Annual",
      category: "all-water",
      description: "Valid to 12/31/2026",
      officialNote: "Official 2026 PFBC fee $60.97.",
    },
    {
      id: "three-year-nonresident",
      name: "3-Year Non-Resident License",
      price: 178.97,
      customerPrice: 299.95,
      residency: "nonresident",
      duration: "3-Year",
      category: "all-water",
      description: "Valid to 12/31/2028",
      officialNote: "Official 2026 PFBC fee $178.97.",
    },
    {
      id: "five-year-nonresident",
      name: "5-Year Non-Resident License",
      price: 296.97,
      customerPrice: 499.95,
      residency: "nonresident",
      duration: "5-Year",
      category: "all-water",
      description: "Valid to 12/31/2030",
      officialNote: "Official 2026 PFBC fee $296.97.",
    },
    {
      id: "ten-year-nonresident",
      name: "10-Year Non-Resident License",
      price: 591.97,
      customerPrice: 887.96,
      residency: "nonresident",
      duration: "10-Year",
      category: "all-water",
      description: "Valid to 12/31/2035",
      officialNote: "Official 2026 PFBC fee $591.97.",
    },
    /* Short-term tourist (non-resident). NOTE: 1-Day and 3-Day Tourist are BOTH
       $31.97 on the official 2026 fee table — verified on two official sources. */
    {
      id: "one-day-tourist",
      name: "1-Day Tourist License",
      price: 31.97,
      customerPrice: 79.92,
      residency: "nonresident",
      duration: "1-Day",
      category: "all-water",
      description: "Includes Trout & Lake Erie permits · Not valid Mar 15 – Apr 30",
      officialNote:
        "Official 2026 PFBC fee $31.97 — identical to the 3-Day Tourist fee on the official table (not a typo). INCLUDES Trout + Lake Erie permit privileges.",
    },
    {
      id: "three-day-tourist",
      name: "3-Day Tourist License",
      price: 31.97,
      customerPrice: 79.92,
      residency: "nonresident",
      duration: "3-Day",
      category: "all-water",
      description: "Valid 3 consecutive days from your start date",
      officialNote:
        "Official 2026 PFBC fee $31.97 — identical to the 1-Day Tourist fee on the official table (not a typo). Does NOT include permit privileges.",
    },
    {
      id: "seven-day-tourist",
      name: "7-Day Tourist License",
      price: 39.47,
      customerPrice: 99.95,
      residency: "nonresident",
      duration: "7-Day",
      category: "all-water",
      description: "Valid 7 consecutive days from your start date",
      officialNote: "Official 2026 PFBC fee $39.47.",
    },
  ],
  addOns: [
    {
      id: "trout-permit",
      name: "Trout Permit",
      price: 14.97,
      customerPrice: 39.95,
      required: false,
      appliesTo: PERMIT_APPLIES_TO,
      description:
        "Required to fish for or possess trout, or fish special-regulation trout waters",
      officialNote: "Official 2026 PFBC fee $14.97 (annual Trout Permit).",
    },
    {
      id: "lake-erie-permit",
      name: "Lake Erie Permit",
      price: 9.97,
      customerPrice: 29.99,
      required: false,
      appliesTo: PERMIT_APPLIES_TO,
      description: "Required for Lake Erie, Presque Isle Bay and their tributaries",
      officialNote: "Official 2026 PFBC fee $9.97 (annual Lake Erie Permit).",
    },
    {
      id: "combo-trout-lake-erie",
      name: "Combination Trout/Lake Erie Permit",
      price: 20.97,
      customerPrice: 59.95,
      required: false,
      appliesTo: PERMIT_APPLIES_TO,
      description: "Both permits together — one combined add-on",
      officialNote:
        "Official 2026 PFBC fee $20.97 (annual Combination Trout/Lake Erie Permit). The wizard treats it as mutually exclusive with the two individual permits.",
    },
  ],
  formFields: [
    {
      name: "idType",
      section: "Identification",
      label: "ID Type",
      type: "select",
      required: true,
      options: [
        {
          value: "Driver's License/State ID",
          label: "Driver's License/State ID",
        },
        { value: "Personal ID Card", label: "Personal ID Card" },
      ],
      step: 2,
    },
    {
      name: "idNumber",
      section: "Identification",
      label: "Identification Number",
      type: "text",
      required: true,
      step: 2,
    },
    {
      name: "driversLicenseState",
      section: "Identification",
      label: "Issuing State",
      type: "select",
      required: true,
      options: upperStateOptions,
      step: 2,
      officialNote:
        "Submitted as the uppercase full state name (wizard pins PA — Pennsylvania first).",
    },
    {
      name: "idCountry",
      section: "Identification",
      label: "Country",
      type: "select",
      required: true,
      options: idCountryOptions,
      defaultValue: "United States",
      step: 2,
      officialNote:
        "Shown only to non-residents in the wizard; residents always submit United States.",
    },
    {
      name: "firstName",
      section: "Personal details",
      label: "First name",
      type: "text",
      required: true,
      autocomplete: "given-name",
      step: 2,
    },
    {
      name: "middleName",
      section: "Personal details",
      label: "Middle name",
      type: "text",
      required: false,
      autocomplete: "additional-name",
      step: 2,
    },
    {
      name: "lastName",
      section: "Personal details",
      label: "Last name",
      type: "text",
      required: true,
      autocomplete: "family-name",
      step: 2,
    },
    {
      name: "dateOfBirth",
      section: "Personal details",
      label: "Date of birth",
      type: "date",
      required: true,
      placeholder: "mm/dd/yyyy",
      mask: "dob",
      step: 2,
    },
    {
      name: "email",
      section: "Personal details",
      label: "Email address",
      type: "email",
      required: true,
      autocomplete: "email",
      step: 2,
    },
    {
      name: "primaryPhone",
      section: "Personal details",
      label: "Phone number",
      type: "tel",
      required: false,
      mask: "phone",
      autocomplete: "tel",
      step: 2,
    },
    {
      name: "ssn",
      section: "Personal details",
      label: "Social Security Number",
      type: "ssn",
      required: true,
      mask: "ssn",
      placeholder: "123-45-6789",
      helpText:
        "Pennsylvania requires an SSN from all license buyers under federal and state child-support enforcement law. Your SSN is transmitted encrypted and is masked in all notifications after submission.",
      step: 2,
    },
    {
      name: "gender",
      section: "Demographics",
      label: "Gender",
      type: "select",
      required: true,
      options: [
        { value: "MALE", label: "MALE" },
        { value: "FEMALE", label: "FEMALE" },
        { value: "NON-BINARY", label: "NON-BINARY" },
        { value: "OTHER", label: "OTHER" },
      ],
      step: 2,
    },
    {
      name: "heightFt",
      section: "Demographics",
      label: "Height (ft)",
      type: "select",
      required: true,
      options: ["3", "4", "5", "6", "7"].map((v) => ({ value: v, label: v })),
      step: 2,
    },
    {
      name: "heightIn",
      section: "Demographics",
      label: "Height (in)",
      type: "select",
      required: true,
      options: Array.from({ length: 12 }, (_, i) => ({
        value: String(i),
        label: String(i),
      })),
      step: 2,
    },
    {
      name: "weightPounds",
      section: "Demographics",
      label: "Weight (lbs)",
      type: "number",
      required: true,
      validation: { min: 1, max: 999 },
      step: 2,
    },
    {
      name: "hairColor",
      section: "Demographics",
      label: "Hair Color",
      type: "select",
      required: true,
      options: hairColorOptions,
      step: 2,
      officialNote:
        "HuntFishPA identifying characteristic; required on this wizard so operators can complete the portal profile.",
    },
    {
      name: "eyeColor",
      section: "Demographics",
      label: "Eye Color",
      type: "select",
      required: true,
      options: eyeColorOptions,
      step: 2,
      officialNote:
        "HuntFishPA identifying characteristic; required on this wizard so operators can complete the portal profile.",
    },
    {
      name: "resStreet1",
      section: "Residential Address",
      label: "Street Address",
      type: "text",
      required: true,
      autocomplete: "address-line1",
      step: 2,
    },
    {
      name: "resCity",
      section: "Residential Address",
      label: "City",
      type: "text",
      required: true,
      autocomplete: "address-level2",
      step: 2,
    },
    {
      name: "resState",
      section: "Residential Address",
      label: "State",
      type: "select",
      required: true,
      options: upperStateOptions,
      step: 2,
      officialNote: "Submitted as the uppercase full state name; defaults to PENNSYLVANIA.",
    },
    {
      name: "resZip",
      section: "Residential Address",
      label: "ZIP",
      type: "zip",
      required: true,
      mask: "zip",
      autocomplete: "postal-code",
      step: 2,
    },
    {
      name: "county",
      section: "Residential Address",
      label: "County",
      type: "select",
      required: true,
      options: countyOptions,
      step: 2,
      officialNote:
        "HuntFishPA county of residence. PA's 67 counties plus Out of State for nonresidents.",
    },
    {
      name: "resCountry",
      section: "Residential Address",
      label: "Country",
      type: "select",
      required: true,
      options: resCountryOptions,
      defaultValue: "UNITED STATES",
      step: 2,
      officialNote:
        "Auto-derived: non-residents with a non-US ID country submit that country in caps; everyone else submits UNITED STATES.",
    },
    // Auto-derived from the Step 1 residency choice — never re-asked on the
    // applicant step. Still validated and included in the submission.
    {
      name: "pennsylvaniaResident",
      section: "Residential Address",
      label: "Pennsylvania resident",
      type: "select",
      required: true,
      hidden: true,
      options: [
        { value: "Yes", label: "Yes" },
        { value: "No", label: "No" },
      ],
      step: 2,
    },
    // Purchase-flow addition: 1-day and multi-day tourist licenses run for
    // consecutive days from a buyer-selected start date. Shown only when a
    // short-term license is selected in step 1 (conditional on licenseId).
    {
      name: "licenseStartDate",
      section: "License start date",
      label: "License start date",
      type: "date",
      required: true,
      conditional: {
        field: "licenseId",
        oneOf: [...PA_SHORT_TERM_IDS],
      },
      helpText:
        "Choose the day your license should start. You can select today or a future date.",
      step: 2,
      officialNote:
        "1-day licenses are not valid Mar 15 – Apr 30; 3-day/7-day tourist licenses run consecutive days from the selected start date.",
    },
  ],
  consentExtra:
    "By submitting, you authorize Castline to assist with your Pennsylvania fishing license application and to process payment for the selected license and permits.",
  researchNotes:
    "Fees are the official 2026 PFBC fee table, verified 2026-08-26 on pa.gov/agencies/fishandboat/fishing/buy-fishing-license-permit, the official eRegulations Pennsylvania fishing digest, and the PFBC newsroom 2026-licenses launch release (2026 licenses on sale Dec 2025; valid Dec 1, 2025 - Dec 31, 2026, up to 13 months). Portal quirks kept verbatim: (1) 1-Day Tourist and 3-Day Tourist are BOTH $31.97 on the official 2026 fee table - confirmed on two official sources, not a typo. (2) The 1-Day Tourist license INCLUDES Trout + Lake Erie permit privileges; the 1-Day Resident license does NOT. Both 1-day licenses are not valid Mar 15 - Apr 30 (season-opening blackout). (3) PA requires an SSN from all license buyers (federal child-support enforcement / welfare-reform mandate cited in the PFBC licensing FAQ). Voluntary youth licenses, military/disabled free licenses, and multi-year (3/5/10-yr) Trout & Combo permits exist on HuntFishPA but are intentionally excluded from this curated wizard - annual permits only, matching the curation used for the other seven states. PRICING: every license and add-on carries an EXACT customerPrice (updated 2026-08-28) that is displayed and charged verbatim; the PRICE_MARKUP formula is not used for Pennsylvania. Sources: https://www.pa.gov/agencies/fishandboat/fishing/buy-fishing-license-permit ; https://www.eregulations.com/pennsylvania/fishing/fishing-licenses-permits ; https://www.pa.gov/agencies/fishandboat/newsroom (2026 licenses launch, Dec 2025) ; https://huntfish.pa.gov/",
};

export default config;
