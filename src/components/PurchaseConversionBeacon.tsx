"use client";

import { useEffect } from "react";
import { trackGoogleAdsPurchase } from "@/lib/google-ads";

/**
 * Fires all Google Ads Purchase conversion events once the order succeeds.
 * Mount on every post-payment confirmation UI (checkout + retry pay link).
 */
export function PurchaseConversionBeacon({
  transactionId,
  value,
  currency = "USD",
}: {
  transactionId: string;
  /** Order total in USD (falls back to 1.0 if missing). */
  value?: number;
  currency?: string;
}) {
  useEffect(() => {
    if (!transactionId) return;
    trackGoogleAdsPurchase({ transactionId, value, currency });
  }, [transactionId, value, currency]);

  return null;
}
