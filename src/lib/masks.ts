/**
 * Input mask helpers for the application form.
 * Each takes raw input and returns the masked display value.
 */

/** 123456789 -> 123-45-6789 */
export function maskSSNInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  if (digits.length > 5) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }
  if (digits.length > 3) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return digits;
}

/** 5551234567 -> (555) 123-4567. Extra digits are kept (no length cap). */
export function maskPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length > 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length > 3) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  if (digits.length > 0) {
    return `(${digits}`;
  }
  return digits;
}

/** 01011990 -> 01/01/1990 */
export function maskDOBInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }
  if (digits.length > 2) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

/** 123456789 -> 12345-6789 */
export function maskZipInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 9);
  if (digits.length > 5) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return digits;
}

/** Apply a named mask from FormFieldDef.mask. */
export function applyMask(mask: "ssn" | "phone" | "dob" | "zip", value: string): string {
  switch (mask) {
    case "ssn":
      return maskSSNInput(value);
    case "phone":
      return maskPhoneInput(value);
    case "dob":
      return maskDOBInput(value);
    case "zip":
      return maskZipInput(value);
  }
}
