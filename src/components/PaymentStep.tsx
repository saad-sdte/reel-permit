"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { WhopCheckoutEmbed } from "@whop/checkout/react";
import { CheckCircle2, CreditCard, HelpCircle, Loader2, Lock, ShieldCheck } from "lucide-react";
import type { TokenizedPayment } from "@/lib/state-config";
import { tokenizeCard } from "@/lib/payment-client";
import {
  billingZipError,
  BRAND_LABELS,
  cardNumberError,
  cvvError,
  detectBrand,
  expiryError,
  formatCardNumber,
  formatExpiry,
  type CardBrand,
} from "@/lib/card";
import { formatPrice } from "@/lib/format";
import {
  applyPromoCode,
  isTestPromoUiEnabled,
  normalizePromoCode,
} from "@/lib/promo";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/i18n/LocaleProvider";

type FieldKey = "number" | "expiry" | "cvv" | "zip";

export type CheckoutStartResult = {
  ok?: boolean;
  awaitingPayment?: boolean;
  useLocalCard?: boolean;
  alreadyPaid?: boolean;
  duplicate?: boolean;
  checkoutSessionId?: string;
  planId?: string | null;
  applicationId?: string | null;
  reference?: string;
  amount?: number;
  message?: string;
};

export type PaidResult = {
  reference: string;
  email?: string | null;
  amount: number;
};

function BrandBadge({ brand }: { brand: CardBrand }) {
  if (brand === "unknown") {
    return <CreditCard className="h-5 w-5 text-slate-400" aria-hidden="true" />;
  }
  const styles: Record<Exclude<CardBrand, "unknown">, string> = {
    visa: "bg-[#1a1f71] text-white",
    mastercard: "bg-slate-900 text-white",
    amex: "bg-[#2e77bc] text-white",
    discover: "bg-[#f48120] text-white",
  };
  const labels: Record<Exclude<CardBrand, "unknown">, string> = {
    visa: "VISA",
    mastercard: "Mastercard",
    amex: "AMEX",
    discover: "Discover",
  };
  return (
    <span
      aria-label={BRAND_LABELS[brand]}
      className={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${styles[brand]}`}
    >
      {labels[brand]}
    </span>
  );
}

function AcceptedCards() {
  return (
    <div className="flex items-center gap-1.5" aria-label="Accepted cards: Visa, Mastercard, American Express, Discover">
      {(["visa", "mastercard", "amex", "discover"] as const).map((b) => (
        <BrandBadge key={b} brand={b} />
      ))}
    </div>
  );
}

async function waitForPaid(applicationId: string): Promise<PaidResult | null> {
  for (let i = 0; i < 16; i++) {
    const res = await fetch(`/api/checkout/status?applicationId=${encodeURIComponent(applicationId)}`);
    const json = (await res.json()) as {
      paid?: boolean;
      reference?: string;
      email?: string | null;
      amount?: number;
    };
    if (res.ok && json.paid && json.reference) {
      return {
        reference: json.reference,
        email: json.email,
        amount: typeof json.amount === "number" ? json.amount : 0,
      };
    }
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
  return null;
}

export function PaymentStep({
  total,
  processing,
  error,
  onPay,
  onStartCheckout,
  onPaid,
  applicantEmail,
  licenseSummary,
  compact,
}: {
  total: number;
  stateName: string;
  processing: boolean;
  error: string | null;
  onPay: (payment: TokenizedPayment, promoCode?: string | null) => void;
  onStartCheckout: (promoCode?: string | null) => Promise<CheckoutStartResult>;
  onPaid: (result: PaidResult) => void;
  applicantEmail?: string;
  licenseSummary?: { name: string; price: number } | null;
  compact?: boolean;
}) {
  const { t } = useLocale();
  const showPromo = isTestPromoUiEnabled();
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [zip, setZip] = useState("");
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [tokenizing, setTokenizing] = useState(false);
  const [tokenizeError, setTokenizeError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [whopSessionId, setWhopSessionId] = useState<string | null>(null);
  const [whopPlanId, setWhopPlanId] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [pendingReference, setPendingReference] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const onStartRef = useRef(onStartCheckout);
  onStartRef.current = onStartCheckout;
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  const brand = useMemo(() => detectBrand(number), [number]);
  const busy = processing || tokenizing || starting || confirming;
  const { amount: chargeTotal } = applyPromoCode(total, appliedPromo);
  const liveWhop = Boolean(whopSessionId || whopPlanId);

  useEffect(() => {
    let cancelled = false;
    setStarting(true);
    setTokenizeError(null);
    onStartRef
      .current(appliedPromo)
      .then((result) => {
        if (cancelled) return;
        if (result.applicationId) setApplicationId(result.applicationId);
        if (result.reference) setPendingReference(result.reference);
        if (result.reference && (result.alreadyPaid || result.duplicate)) {
          onPaidRef.current({
            reference: result.reference,
            email: applicantEmail ?? null,
            amount: typeof result.amount === "number" ? result.amount : chargeTotal,
          });
          return;
        }
        if (result.awaitingPayment && (result.checkoutSessionId || result.planId)) {
          setWhopSessionId(result.checkoutSessionId ?? null);
          setWhopPlanId(result.planId ?? null);
          return;
        }
        if (result.ok === false) {
          setTokenizeError(result.message ?? "Payment could not be started. Please try again.");
        }
        setWhopSessionId(null);
        setWhopPlanId(null);
      })
      .catch(() => {
        if (!cancelled) {
          setTokenizeError("We could not reach the server. Check your connection and try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setStarting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [appliedPromo]);

  function validateField(key: FieldKey) {
    const message =
      key === "number"
        ? cardNumberError(number)
        : key === "expiry"
          ? expiryError(expiry)
          : key === "cvv"
            ? cvvError(cvv, brand)
            : billingZipError(zip);
    setErrors((e) => ({ ...e, [key]: message ?? undefined }));
    return message === null;
  }

  async function handleLocalPay() {
    if (busy) return;
    setTokenizeError(null);
    const nextErrors: Partial<Record<FieldKey, string>> = {};
    for (const key of ["number", "expiry", "cvv", "zip"] as FieldKey[]) {
      const message =
        key === "number"
          ? cardNumberError(number)
          : key === "expiry"
            ? expiryError(expiry)
            : key === "cvv"
              ? cvvError(cvv, brand)
              : billingZipError(zip);
      if (message) nextErrors[key] = message;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      document.querySelector<HTMLElement>('[data-payment-fields] [aria-invalid="true"]')?.focus();
      return;
    }

    const digits = number.replace(/\D/g, "");
    const [mm, yy] = expiry.split("/");
    setTokenizing(true);
    try {
      const tokenized = await tokenizeCard({
        number: digits,
        expMonth: mm,
        expYear: `20${yy}`,
        cvv,
      });
      onPay(
        {
          token: tokenized.token,
          last4: tokenized.last4,
          brand: BRAND_LABELS[brand],
          billingZip: zip.trim(),
        },
        appliedPromo,
      );
    } catch (err) {
      setTokenizeError(
        err instanceof Error ? err.message : "We couldn't process your card. Please try again.",
      );
    } finally {
      setTokenizing(false);
    }
  }

  async function handleWhopComplete() {
    setConfirming(true);
    setTokenizeError(null);
    try {
      const paid = applicationId ? await waitForPaid(applicationId) : null;
      onPaidRef.current({
        reference: paid?.reference ?? pendingReference ?? "RP-PENDING",
        email: paid?.email ?? applicantEmail ?? null,
        amount: paid?.amount != null ? paid.amount : chargeTotal,
      });
    } finally {
      setConfirming(false);
    }
  }

  function handleApplyPromo() {
    const normalized = normalizePromoCode(promoInput);
    if (!normalized) {
      setAppliedPromo(null);
      setPromoMessage(null);
      return;
    }
    const { amount: promoAmount, applied } = applyPromoCode(total, normalized);
    if (applied) {
      setAppliedPromo(applied);
      setPromoMessage(
        promoAmount === 0
          ? `Promo ${applied} applied — $0.00 test order (no card charge).`
          : `Promo ${applied} applied — test charge of ${formatPrice(promoAmount)}.`,
      );
    } else {
      setAppliedPromo(null);
      setPromoMessage("That promo code is not valid.");
    }
  }

  const embedProps = {
    theme: "light" as const,
    skipRedirect: true,
    hidePrice: true,
    hideAddressForm: true,
    hideEmail: Boolean(applicantEmail),
    disableEmail: Boolean(applicantEmail),
    prefill: applicantEmail ? { email: applicantEmail } : undefined,
    themeOptions: {
      accentColor: "#16332b",
      borderRadius: 8,
      buttonText: `Pay ${formatPrice(chargeTotal)}`,
    },
    onComplete: () => {
      void handleWhopComplete();
    },
    onPaymentError: (err: { message: string }) => {
      setTokenizeError(err.message || "Your payment could not be completed. Please try a different card.");
    },
    fallback: (
      <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" aria-hidden="true" />
      </div>
    ),
  };

  return (
    <Card
      className={
        compact
          ? "overflow-hidden rounded border border-slate-200 bg-white shadow-sm"
          : "overflow-hidden rounded-[22px] border-slate-200 bg-white shadow-[0_18px_60px_-24px_rgba(15,23,42,0.45)]"
      }
    >
      {!compact && (
        <div className="bg-gradient-to-r from-navy to-[#17305f] px-6 py-4 text-white sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                Secure checkout
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">Payment details</h3>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
              <Lock className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
              256-bit SSL protected
            </div>
          </div>
        </div>
      )}

      <div className={compact ? "px-4 py-5 sm:px-5" : "px-6 py-6 sm:px-8"}>
        {licenseSummary && (
          <div className="mb-5 flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Selected License
              </p>
              <p className="text-sm font-semibold text-slate-800">{licenseSummary.name}</p>
            </div>
            <p className="text-lg font-bold text-navy">{formatPrice(licenseSummary.price)}</p>
          </div>
        )}

        <div className={`rounded-2xl border border-forest-200 bg-gradient-to-br from-forest-50 via-white to-sky-50 px-4 py-4 ${compact ? "hidden" : ""}`}>
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-forest-100">
              <ShieldCheck className="h-5 w-5 text-forest-700" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-navy">Secure card entry</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {liveWhop
                  ? "Enter your card in the secure fields below. Your details are encrypted by Whop and never touch ReelPermit's servers."
                  : "Your card details are tokenized locally in development. Production checkout uses Whop."}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-forest-600" aria-hidden="true" />
                  Hosted by our processor
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                  <AcceptedCards />
                </span>
              </div>
            </div>
          </div>
        </div>

        {starting ? (
          <div className="mt-5 flex min-h-[160px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
            <p className="inline-flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Preparing secure checkout…
            </p>
          </div>
        ) : liveWhop ? (
          <div className="mt-5">
            {whopSessionId?.startsWith("chs_") || !whopPlanId ? (
              <WhopCheckoutEmbed sessionId={whopSessionId!} {...embedProps} />
            ) : (
              <WhopCheckoutEmbed planId={whopPlanId} {...embedProps} />
            )}
            {confirming && (
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Confirming your payment…
              </p>
            )}
          </div>
        ) : (
          <div data-payment-fields className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label={t("pay.cardNumber")}
                name="cardNumber"
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="1234 5678 9012 3456"
                value={number}
                onChange={(e) => setNumber(formatCardNumber(e.target.value))}
                onBlur={() => validateField("number")}
                error={errors.number}
                required
                disabled={busy}
                rightAdornment={<BrandBadge brand={brand} />}
              />
            </div>
            <Input
              label={t("pay.expiry")}
              name="cardExpiry"
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              onBlur={() => validateField("expiry")}
              error={errors.expiry}
              required
              disabled={busy}
            />
            <div className="relative">
              <Input
                label={t("pay.cvv")}
                name="cardCvv"
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder={brand === "amex" ? "4 digits" : "3 digits"}
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                onBlur={() => validateField("cvv")}
                error={errors.cvv}
                required
                disabled={busy}
                rightAdornment={
                  <span className="group relative inline-flex">
                    <button
                      type="button"
                      aria-label="Where is my security code?"
                      className="rounded p-1 text-slate-400 hover:text-navy focus-visible:text-navy"
                    >
                      <HelpCircle className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute bottom-full right-0 z-10 mb-2 w-56 rounded-lg bg-navy px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                    >
                      {brand === "amex"
                        ? "American Express: the 4-digit code printed on the front of your card."
                        : "The 3-digit code in the signature panel on the back of your card."}
                    </span>
                  </span>
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label={t("pay.billingZip")}
                name="billingZip"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="12345"
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/[^\d-]/g, "").slice(0, 10))}
                onBlur={() => validateField("zip")}
                error={errors.zip}
                required
                disabled={busy}
              />
            </div>
          </div>
        )}

        {(tokenizeError || error) && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {tokenizeError ?? error}
          </div>
        )}

        <p className="mt-6 text-sm leading-relaxed text-slate-600">
          By paying, you agree to our{" "}
          <Link href="/terms" target="_blank" className="font-medium text-forest-700 underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" className="font-medium text-forest-700 underline">
            Privacy Policy
          </Link>{" "}
          and authorize ReelPermit to charge your credit card.
        </p>

        {!liveWhop && !starting && (
          <Button
            variant="accent"
            size="lg"
            className="mt-5 w-full min-h-[48px] rounded-xl bg-gradient-to-r from-forest-600 to-forest-500 text-base shadow-[0_12px_30px_-12px_rgba(22,163,74,0.7)] hover:from-forest-500 hover:to-forest-400"
            onClick={() => void handleLocalPay()}
            disabled={busy}
            aria-live="polite"
          >
            {busy ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                {t("pay.processing")}
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" aria-hidden="true" />
                {t("pay.payNow", { amount: formatPrice(chargeTotal) })}
              </>
            )}
          </Button>
        )}
        <p className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Your card is charged once, and your receipt shows &ldquo;REELPERMIT&rdquo;.
        </p>

        {showPromo && (
          <div className="mt-4">
            {!promoOpen && !appliedPromo ? (
              <p className="text-center">
                <button
                  type="button"
                  onClick={() => setPromoOpen(true)}
                  disabled={busy}
                  className="text-sm font-medium text-forest-700 underline decoration-forest-300 underline-offset-2 hover:text-forest-800 disabled:opacity-50"
                >
                  Have a promo code?
                </button>
              </p>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Input
                      label={t("pay.promo")}
                      name="promoCode"
                      type="text"
                      autoComplete="off"
                      placeholder={t("pay.enterCode")}
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyPromo();
                        }
                      }}
                      disabled={busy}
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={handleApplyPromo} disabled={busy}>
                    Apply
                  </Button>
                </div>
                {promoMessage && (
                  <p
                    className={`mt-2 text-xs font-medium ${appliedPromo ? "text-forest-700" : "text-red-600"}`}
                    role="status"
                  >
                    {promoMessage}
                  </p>
                )}
                {appliedPromo && chargeTotal !== total && (
                  <p className="mt-1 text-xs text-slate-500">
                    Original total {formatPrice(total)} → {formatPrice(chargeTotal)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
