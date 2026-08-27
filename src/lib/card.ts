/**
 * Client-side card helpers: formatting, brand detection, validation.
 *
 * SECURITY (grep-proof rule): values produced/consumed here are used ONLY in
 * the browser for display, validation, and client-side tokenization. The full
 * card number, expiry, and CVV are NEVER sent to our API and NEVER logged.
 */

export type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "unknown";

export const BRAND_LABELS: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  unknown: "Card",
};

/** Detect the card brand from leading digits (IIN ranges). */
export function detectBrand(number: string): CardBrand {
  const digits = number.replace(/\D/g, "");
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^(6011|65|64[4-9])/.test(digits)) return "discover";
  return "unknown";
}

/** Max digits for a brand (amex 15, others 16). */
export function maxCardDigits(brand: CardBrand): number {
  return brand === "amex" ? 15 : 16;
}

/** Format a card number with spaces: 4-4-4-4 groups (amex 4-6-5). */
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  const brand = detectBrand(digits);
  const capped = digits.slice(0, maxCardDigits(brand));
  if (brand === "amex") {
    return [capped.slice(0, 4), capped.slice(4, 10), capped.slice(10, 15)]
      .filter(Boolean)
      .join(" ");
  }
  return capped.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** Format expiry as MM/YY with the slash inserted automatically. */
export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length === 0) return "";
  // Snap an impossible first month digit to a valid month ("9" -> "09").
  let mm = digits.slice(0, 2);
  if (digits.length === 1 && Number(digits) > 1) mm = `0${digits}`;
  if (mm.length === 2 && Number(mm) > 12) mm = "12";
  if (mm.length === 2 && Number(mm) === 0) mm = "01";
  if (digits.length <= 2) return mm.length === 2 && digits.length === 2 ? `${mm}/` : mm;
  return `${mm}/${digits.slice(2)}`;
}

/** Luhn checksum. */
export function luhnValid(number: string): boolean {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 13) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function cardNumberError(number: string): string | null {
  const digits = number.replace(/\D/g, "");
  if (!digits) return "Card number is required";
  const brand = detectBrand(digits);
  if (digits.length !== maxCardDigits(brand)) {
    return `Enter the full ${maxCardDigits(brand)}-digit card number`;
  }
  if (!luhnValid(digits)) return "This card number doesn't look right — check it and try again";
  return null;
}

/** Validate "MM/YY": real month, not in the past. */
export function expiryError(expiry: string): string | null {
  const match = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return expiry ? "Enter the expiry as MM/YY" : "Expiry date is required";
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return "Enter a valid month (01–12)";
  const now = new Date();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  if (endOfMonth < now) return "This card is expired";
  return null;
}

/** CVV: 4 digits for amex, 3 otherwise. */
export function cvvError(cvv: string, brand: CardBrand): string | null {
  const expected = brand === "amex" ? 4 : 3;
  const digits = cvv.replace(/\D/g, "");
  if (!digits) return "Security code is required";
  if (digits.length !== expected) {
    return brand === "amex"
      ? "Enter the 4-digit code on the front of the card"
      : "Enter the 3-digit code on the back of the card";
  }
  return null;
}

export function billingZipError(zip: string): string | null {
  const trimmed = zip.trim();
  if (!trimmed) return "Billing ZIP code is required";
  if (!/^\d{5}(-\d{4})?$/.test(trimmed)) return "Enter a valid billing ZIP code";
  return null;
}
