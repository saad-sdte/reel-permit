/**
 * Test-only promo codes.
 *
 * Enable with ALLOW_TEST_PROMO=true (and NEXT_PUBLIC_ALLOW_TEST_PROMO=true so the
 * checkout UI shows the field). Also enabled automatically in development.
 * Leave unset in production unless you are actively running a test charge.
 */

/** Canonical $1 test code → charges $1.00 on any license. */
export const TEST_PROMO_CODE = "TESTREEL1";

/** Canonical $0 test code → completes the order with no card charge. */
export const ZERO_PROMO_CODE = "TESTREEL0";

/** Fixed $1 test total in USD. */
export const TEST_PROMO_AMOUNT = 1;

/** Fixed $0 test total in USD. */
export const ZERO_PROMO_AMOUNT = 0;

const TEST_PROMO_AMOUNTS: Record<string, number> = {
  [TEST_PROMO_CODE]: TEST_PROMO_AMOUNT,
  [ZERO_PROMO_CODE]: ZERO_PROMO_AMOUNT,
};

export function isTestPromoEnabled(): boolean {
  return (
    process.env.ALLOW_TEST_PROMO === "true" ||
    process.env.NEXT_PUBLIC_ALLOW_TEST_PROMO === "true" ||
    process.env.NODE_ENV === "development"
  );
}

/** True when the browser should show the promo-code field. */
export function isTestPromoUiEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_ALLOW_TEST_PROMO === "true" ||
    process.env.NODE_ENV === "development"
  );
}

/**
 * Normalize a user-entered code (trim + uppercase). Empty → null.
 */
export function normalizePromoCode(code: unknown): string | null {
  if (typeof code !== "string") return null;
  const trimmed = code.trim().toUpperCase();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Apply a promo to a server-computed order total. Unknown / disabled codes
 * leave the amount unchanged.
 */
export function applyPromoCode(amount: number, code: unknown): {
  amount: number;
  applied: string | null;
} {
  const normalized = normalizePromoCode(code);
  if (!normalized || !isTestPromoEnabled()) {
    return { amount, applied: null };
  }
  if (Object.prototype.hasOwnProperty.call(TEST_PROMO_AMOUNTS, normalized)) {
    return { amount: TEST_PROMO_AMOUNTS[normalized]!, applied: normalized };
  }
  return { amount, applied: null };
}
