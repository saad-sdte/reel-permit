"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { TokenizedPayment } from "@/lib/state-config";
import { PaymentStep, type CheckoutStartResult, type PaidResult } from "@/components/PaymentStep";
import { PurchaseConversionBeacon } from "@/components/PurchaseConversionBeacon";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/contact";

/**
 * Client half of /pay/{token}: reuses PaymentStep (Whop embed in production,
 * local simulated card in development) and completes payment for a declined
 * application without requiring login.
 */
export function RetryCheckout({
  retryToken,
  total,
  stateName,
  reference,
  email,
}: {
  retryToken: string;
  total: number;
  stateName: string;
  reference: string;
  email?: string | null;
}) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | {
    reference: string;
    alreadyPaid?: boolean;
    amount: number;
  }>(null);
  const [linkDead, setLinkDead] = useState(false);

  async function startCheckout(promoCode?: string | null): Promise<CheckoutStartResult> {
    try {
      const res = await fetch("/api/payments/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: retryToken,
          ...(promoCode ? { promoCode } : {}),
        }),
      });
      const json = (await res.json()) as CheckoutStartResult & { tokenState?: string };
      if (res.status === 410) {
        setLinkDead(true);
        return { ok: false, message: "This payment link is no longer valid." };
      }
      if (!res.ok && !json.useLocalCard && !json.awaitingPayment) {
        return { ok: false, message: json.message ?? "Payment could not be started. Please try again." };
      }
      return json;
    } catch {
      return { ok: false, message: "We could not reach the server. Check your connection and try again." };
    }
  }

  function handlePaid(result: PaidResult) {
    setDone({
      reference: result.reference,
      amount: typeof result.amount === "number" ? result.amount : total,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handlePay(payment: TokenizedPayment, promoCode?: string | null) {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: retryToken,
          payment,
          ...(promoCode ? { promoCode } : {}),
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        reference?: string;
        alreadyPaid?: boolean;
        amount?: number;
        message?: string;
        tokenState?: string;
      };
      if (res.ok && json.ok && json.reference) {
        setDone({
          reference: json.reference,
          alreadyPaid: json.alreadyPaid,
          amount: typeof json.amount === "number" ? json.amount : total,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (res.status === 410) {
        setLinkDead(true);
        return;
      }
      setError(
        json.message ?? "Your payment could not be completed. Please try a different card.",
      );
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
    } finally {
      setProcessing(false);
    }
  }

  if (done) {
    return (
      <Card>
        <PurchaseConversionBeacon transactionId={done.reference} value={done.amount} />
        <div className="px-6 py-12 text-center sm:px-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest-50">
            <CheckCircle2 className="h-8 w-8 text-forest-600" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-2xl font-bold text-navy">
            {done.alreadyPaid ? "You were already all set" : "Payment complete — we're on it"}
          </h2>
          <p className="mx-auto mt-3 max-w-md leading-relaxed text-slate-600">
            Your application <span className="font-mono font-semibold text-navy">{done.reference}</span>{" "}
            is paid and now in our review queue. Your receipt is on its way to your inbox, and your{" "}
            {stateName} license will follow by email once it&rsquo;s issued — typically within 1
            business day.
          </p>
          <p className="mt-6 text-sm text-slate-500">
            You can close this page. Questions? Email{" "}
            <a href={SUPPORT_MAILTO} className="font-semibold text-forest-700 underline">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </div>
      </Card>
    );
  }

  if (linkDead) {
    return (
      <Card>
        <div className="px-6 py-12 text-center sm:px-10">
          <h2 className="text-xl font-bold text-navy">This payment link is no longer valid</h2>
          <p className="mx-auto mt-3 max-w-md leading-relaxed text-slate-600">
            It may have expired or been replaced by a newer email. Check your most recent message
            from us, or start a fresh application — it takes about 2 minutes.
          </p>
          <Link href="/apply" className={`${buttonClasses("accent")} mt-8`}>
            Start a new application
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <PaymentStep
        total={total}
        stateName={stateName}
        processing={processing}
        error={error}
        onPay={handlePay}
        onStartCheckout={startCheckout}
        onPaid={handlePaid}
        applicantEmail={email ?? undefined}
      />
      <p className="mt-4 text-center text-xs text-slate-500">
        Application <span className="font-mono">{reference}</span> · card details never touch our
        servers.
      </p>
    </div>
  );
}
