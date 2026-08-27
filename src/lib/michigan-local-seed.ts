import { readFileSync } from "fs";
import path from "path";
import type { ApplicationRecord } from "@/lib/storage";

type SeedDoc = Omit<ApplicationRecord, "id"> & {
  _id: string;
  updatedAt: string;
  paymentMeta?: {
    last4?: string;
    brand?: string;
    descriptor?: string;
    devMode?: boolean;
  };
};

export const MICHIGAN_LOCAL_BATCH = "ops-mi-local-8";

type MiPerson = {
  n: number;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix?: string;
  gender: "MALE" | "FEMALE";
  dob: string;
  phone: string;
  residency: "resident" | "nonresident";
  licenseId: string;
  amount: number;
  idType: string;
  idNumber: string;
  driversLicenseState?: string;
  heightFt: string;
  heightIn: string;
  weightPounds: string;
  street: string;
  city: string;
  resState: string;
  zip: string;
  michiganResident: "Yes" | "No";
};

const PEOPLE: MiPerson[] = [
  {
    n: 1,
    firstName: "Taylor",
    middleName: "A",
    lastName: "Rivera",
    gender: "MALE",
    dob: "03/12/1990",
    phone: "(517) 555-0142",
    residency: "resident",
    licenseId: "annual-all-species-resident",
    amount: 59.95,
    idType: "Driver's License/State ID",
    idNumber: "S123456789012",
    driversLicenseState: "MICHIGAN",
    heightFt: "5",
    heightIn: "10",
    weightPounds: "180",
    street: "100 Main Street",
    city: "Lansing",
    resState: "MICHIGAN",
    zip: "48933",
    michiganResident: "Yes",
  },
  {
    n: 2,
    firstName: "Jordan",
    middleName: "Lee",
    lastName: "Nguyen",
    suffix: "JR",
    gender: "FEMALE",
    dob: "07/22/1985",
    phone: "(512) 555-0188",
    residency: "nonresident",
    licenseId: "annual-all-species-nonresident",
    amount: 149.95,
    idType: "Driver's License/State ID",
    idNumber: "OH9876543",
    driversLicenseState: "OHIO",
    heightFt: "5",
    heightIn: "6",
    weightPounds: "140",
    street: "200 High Street",
    city: "Columbus",
    resState: "OHIO",
    zip: "43215",
    michiganResident: "No",
  },
  {
    n: 3,
    firstName: "Casey",
    middleName: "M",
    lastName: "Patel",
    gender: "MALE",
    dob: "11/04/1998",
    phone: "(616) 555-0164",
    residency: "resident",
    licenseId: "daily-all-species",
    amount: 30,
    idType: "Sportcard Number",
    idNumber: "SC99887766",
    heightFt: "6",
    heightIn: "1",
    weightPounds: "195",
    street: "55 River Rd",
    city: "Grand Rapids",
    resState: "MICHIGAN",
    zip: "49503",
    michiganResident: "Yes",
  },
  {
    n: 4,
    firstName: "Riley",
    middleName: "S",
    lastName: "Brooks",
    suffix: "SR",
    gender: "FEMALE",
    dob: "01/30/1958",
    phone: "(734) 555-0190",
    residency: "resident",
    licenseId: "hunt-fish-combo-resident",
    amount: 228,
    idType: "Customer Number",
    idNumber: "100200300",
    heightFt: "5",
    heightIn: "4",
    weightPounds: "130",
    street: "12 Oak Ave",
    city: "Ann Arbor",
    resState: "MICHIGAN",
    zip: "48104",
    michiganResident: "Yes",
  },
  {
    n: 5,
    firstName: "Avery",
    middleName: "J",
    lastName: "Cole",
    gender: "FEMALE",
    dob: "09/18/1992",
    phone: "(313) 555-0118",
    residency: "resident",
    licenseId: "annual-all-species-resident",
    amount: 59.95,
    idType: "Driver's License/State ID",
    idNumber: "S555444333222",
    driversLicenseState: "MICHIGAN",
    heightFt: "5",
    heightIn: "7",
    weightPounds: "155",
    street: "880 Woodward Ave",
    city: "Detroit",
    resState: "MICHIGAN",
    zip: "48226",
    michiganResident: "Yes",
  },
  {
    n: 6,
    firstName: "Morgan",
    middleName: "K",
    lastName: "Walsh",
    gender: "MALE",
    dob: "04/06/1979",
    phone: "(231) 555-0177",
    residency: "resident",
    licenseId: "annual-all-species-resident",
    amount: 59.95,
    idType: "Driver's License/State ID",
    idNumber: "S111222333444",
    driversLicenseState: "MICHIGAN",
    heightFt: "5",
    heightIn: "11",
    weightPounds: "175",
    street: "14 Front Street",
    city: "Traverse City",
    resState: "MICHIGAN",
    zip: "49684",
    michiganResident: "Yes",
  },
  {
    n: 7,
    firstName: "Quinn",
    middleName: "",
    lastName: "Hayes",
    gender: "MALE",
    dob: "12/01/1988",
    phone: "(906) 555-0133",
    residency: "resident",
    licenseId: "annual-all-species-resident",
    amount: 59.95,
    idType: "Driver's License/State ID",
    idNumber: "S777888999000",
    driversLicenseState: "MICHIGAN",
    heightFt: "6",
    heightIn: "0",
    weightPounds: "190",
    street: "9 Lake Shore Dr",
    city: "Marquette",
    resState: "MICHIGAN",
    zip: "49855",
    michiganResident: "Yes",
  },
  {
    n: 8,
    firstName: "Drew",
    middleName: "T",
    lastName: "Santos",
    gender: "FEMALE",
    dob: "06/25/1995",
    phone: "(317) 555-0155",
    residency: "nonresident",
    licenseId: "annual-all-species-nonresident",
    amount: 149.95,
    idType: "Driver's License/State ID",
    idNumber: "IN33445566",
    driversLicenseState: "INDIANA",
    heightFt: "5",
    heightIn: "5",
    weightPounds: "135",
    street: "310 Meridian St",
    city: "Indianapolis",
    resState: "INDIANA",
    zip: "46204",
    michiganResident: "No",
  },
];

function loadTestDl(name: string): string | null {
  try {
    const file = path.join(process.cwd(), "exports", "test-uploads", name);
    const buf = readFileSync(file);
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function formFor(p: MiPerson, email: string, images: { front: string | null; back: string | null }) {
  return {
    opsBatch: MICHIGAN_LOCAL_BATCH,
    idType: p.idType,
    idNumber: p.idNumber,
    ...(p.driversLicenseState ? { driversLicenseState: p.driversLicenseState } : {}),
    firstName: p.firstName,
    middleName: p.middleName,
    lastName: p.lastName,
    ...(p.suffix ? { suffix: p.suffix } : {}),
    dateOfBirth: p.dob,
    gender: p.gender,
    heightFt: p.heightFt,
    heightIn: p.heightIn,
    weightPounds: p.weightPounds,
    email,
    primaryPhone: p.phone,
    resStreet1: p.street,
    resCity: p.city,
    resState: p.resState,
    resZip: p.zip,
    resCountry: "UNITED STATES",
    mailStreet1: p.street,
    mailCity: p.city,
    mailState: p.resState,
    mailZip: p.zip,
    mailCountry: "UNITED STATES",
    michiganResident: p.michiganResident,
    legallyBlind: "No",
    studentInMi: "No",
    activeDutyMilitary: "No",
    stationedInMi: "No",
    disabledVeteran: "No",
    ...(images.front
      ? { dlFrontData: images.front, dlFrontName: "tx-dl-front.png", dlUploadData: images.front, dlUploadName: "tx-dl-front.png" }
      : {}),
    ...(images.back ? { dlBackData: images.back, dlBackName: "tx-dl-back.png" } : {}),
  };
}

/** Eight Michigan CRM rows for local Ops Fill testing. Memory-store only. */
export function buildMichiganLocalSeedDocs(): SeedDoc[] {
  const t = new Date().toISOString();
  const images = {
    front: loadTestDl("tx-dl-front.png"),
    back: loadTestDl("tx-dl-back.png"),
  };
  return PEOPLE.map((p) => {
    const email = `ops-michigan-local-${p.n}@reelpermit.local`;
    const formData = formFor(p, email, images);
    return {
      _id: `mi-local-${String(p.n).padStart(2, "0")}`,
      reference: `RP-MICHIGAN-LOCAL-${String(p.n).padStart(2, "0")}`,
      stateSlug: "michigan",
      residency: p.residency,
      licenseId: p.licenseId,
      addOnIds: [],
      email,
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phone,
      formData,
      consents: { terms: true, privacy: true, accurateInfo: true },
      amountCents: Math.round(p.amount * 100),
      status: "received",
      statusReason: "local michigan fill batch",
      existingLicenseExpiresOn: null,
      nmiCustomerVaultId: null,
      submittedAt: t,
      paidAt: t,
      paymentFailedAt: null,
      deliveredAt: null,
      cancelledAt: null,
      refundedAt: null,
      updatedAt: t,
      paymentMeta: { last4: "4242", brand: "Visa", descriptor: "REELPERMIT", devMode: true },
    };
  });
}
