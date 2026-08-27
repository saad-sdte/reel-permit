/**
 * Google Ads conversion accounts + Purchase conversion labels for ReelPermit.
 * Every ads ID must be configured site-wide; every send_to must fire on purchase.
 *
 * NOTE: Customer prices were raised 50% (PRICE_MARKUP 3 → 4.5), but the
 * conversion value reported to Google Ads stays at the PRE-INCREASE price:
 * a license now charged at $75 still reports $50 (see GOOGLE_ADS_VALUE_RATIO).
 * transaction_id, currency, and all other conversion variables are unchanged.
 * Reporting-only — customer-facing prices and charged amounts are untouched.
 */

/**
 * The markup whose prices Google Ads continues to receive (the pre-increase
 * pricing tier). Keep CURRENT_PRICE_MARKUP in sync with PRICE_MARKUP in
 * src/lib/state-config.ts (not imported to keep this module dependency-free
 * for the root layout bundle).
 */
const REPORTED_PRICE_MARKUP = 3;
const CURRENT_PRICE_MARKUP = 4.5;

/**
 * Fraction of the charged amount forwarded to Google Ads as the conversion
 * value. With 3/4.5 this reports exactly the old markup-3 price for every
 * license and add-on in every state: charged $75 → reported $50.
 */
export const GOOGLE_ADS_VALUE_RATIO = REPORTED_PRICE_MARKUP / CURRENT_PRICE_MARKUP;

export type GoogleAdsConversion = {
  adsId: string;
  sendTo: string;
};

/** All Google Ads tags + Purchase conversion snippets (nothing omitted). */
export const GOOGLE_ADS_CONVERSIONS: readonly GoogleAdsConversion[] = [
  {
    adsId: "AW-18321465982",
    sendTo: "AW-18321465982/JWSRCMzP7N4cEP7EraBE",
  },
  {
    adsId: "AW-18321455140",
    sendTo: "AW-18321455140/cWC3CNLk3N4cEKTwrKBE",
  },
  {
    adsId: "AW-18321425650",
    sendTo: "AW-18321425650/iogVCKyB794cEPKJq6BE",
  },
  {
    adsId: "AW-18321396330",
    sendTo: "AW-18321396330/5h2uCIGy3d4cEOqkqaBE",
  },
  {
    adsId: "AW-18321384768",
    sendTo: "AW-18321384768/x3wvCPHd7d4cEMDKqKBE",
  },
  {
    adsId: "AW-18321333884",
    sendTo: "AW-18321333884/4MBKCJPj794cEPy8paBE",
  },
  {
    adsId: "AW-18321299633",
    sendTo: "AW-18321299633/G_TJCO-v3t4cELGxo6BE",
  },
] as const;

export const GOOGLE_ADS_IDS = GOOGLE_ADS_CONVERSIONS.map((c) => c.adsId);

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function markFired(transactionId: string): boolean {
  if (typeof window === "undefined") return false;
  const key = `ga_ads_purchase_${transactionId}`;
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
    return true;
  } catch {
    // sessionStorage blocked — still fire; Google dedupes via transaction_id
    return true;
  }
}

/**
 * Fire Purchase conversion for every configured Google Ads account.
 * Safe to call multiple times for the same reference within a tab (sessionStorage).
 *
 * `opts.value` must be the FULL charged amount; the value actually sent to
 * Google is opts.value × GOOGLE_ADS_VALUE_RATIO — the pre-increase (markup-3)
 * price — rounded to cents. transaction_id and currency pass through as-is.
 */
export function trackGoogleAdsPurchase(opts: {
  transactionId: string;
  value?: number;
  currency?: string;
}): void {
  if (typeof window === "undefined") return;
  const transactionId = opts.transactionId?.trim();
  if (!transactionId) return;
  if (!markFired(transactionId)) return;

  // Report the pre-increase price to Google Ads (all accounts, all states).
  const value =
    typeof opts.value === "number" && Number.isFinite(opts.value) && opts.value > 0
      ? Math.round(opts.value * GOOGLE_ADS_VALUE_RATIO * 100) / 100
      : 1;
  const currency = opts.currency ?? "USD";

  const fire = (): boolean => {
    if (typeof window.gtag !== "function") return false;
    for (const c of GOOGLE_ADS_CONVERSIONS) {
      window.gtag("event", "conversion", {
        send_to: c.sendTo,
        value,
        currency,
        transaction_id: transactionId,
      });
    }
    return true;
  };

  if (fire()) return;

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (fire() || attempts >= 40) window.clearInterval(timer);
  }, 250);
}
