import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { checkRetryToken } from "@/lib/retry-tokens";
import { getApplicationById, type ApplicationRecord } from "@/lib/storage";
import { getStateConfig } from "@/lib/states";
import { formatPrice } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { RetryCheckout } from "./retry-checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /pay/{token} — secure no-login payment retry (every dunning CTA lands here).
 *
 * The cryptographically random token IS the auth. States handled:
 *  - valid + unpaid   -> checkout-grade retry page (order recap + Whop / local card)
 *  - already paid     -> "You're all set" status page
 *  - expired/used/bad -> friendly explanation + start-a-new-application CTA
 *
 * Shows NOTHING sensitive beyond the recap: reference, first name + last
 * initial, license type, total. No SSN, no DOB, no address, ever.
 */

export const metadata: Metadata = {
  title: "Complete your payment",
  robots: { index: false, follow: false },
};

function Hero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="bg-navy py-14 text-white sm:py-16">
      <div className="container-site max-w-3xl">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{title}</h1>
        <p className="mt-3 text-lg text-slate-300">{subtitle}</p>
      </div>
    </section>
  );
}

function LinkExpired({ state }: { state: "expired" | "used" | "invalid" }) {
  const heading =
    state === "used" ? "This payment link was already used" : "This payment link has expired";
  return (
    <>
      <Hero
        title={heading}
        subtitle="For your security, payment links are single-use and expire after a few days."
      />
      <section className="py-14">
        <div className="container-site max-w-2xl">
          <Card>
            <div className="px-6 py-10 text-center sm:px-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <Clock className="h-8 w-8 text-slate-500" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-navy">
                {state === "used" ? "Payment already completed?" : "Need a working link?"}
              </h2>
              <p className="mx-auto mt-3 max-w-md leading-relaxed text-slate-600">
                {state === "used"
                  ? "If you completed payment, your receipt is in your inbox and there's nothing else to do. If not, check your most recent email from us for the current link."
                  : "If we've emailed you a newer payment reminder, use the link in that email — it replaces this one. Otherwise you can start a fresh application in about 2 minutes."}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/apply" className={buttonClasses("accent")}>
                  Start a new application
                </Link>
                <Link href="/contact" className={buttonClasses("outline")}>
                  Contact support
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}

function AlreadyPaid({ app }: { app: ApplicationRecord }) {
  return (
    <>
      <Hero title="You're all set" subtitle="This application has been paid — nothing else is needed." />
      <section className="py-14">
        <div className="container-site max-w-2xl">
          <Card>
            <div className="px-6 py-10 text-center sm:px-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest-50">
                <CheckCircle2 className="h-8 w-8 text-forest-600" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-navy">Payment received</h2>
              <p className="mx-auto mt-3 max-w-md leading-relaxed text-slate-600">
                Your application{" "}
                <span className="font-mono font-semibold text-navy">{app.reference}</span> is paid
                and in our review queue. Your receipt and confirmation are in your inbox, and your
                license will follow by email once it&rsquo;s issued.
              </p>
              <Link href="/contact" className={`${buttonClasses("outline")} mt-8`}>
                Questions? Contact support
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}

export default async function PayPage({ params }: { params: { token: string } }) {
  const check = await checkRetryToken(params.token);

  if (check.status === "invalid") return <LinkExpired state="invalid" />;
  if (check.status === "expired") return <LinkExpired state="expired" />;

  const app = await getApplicationById(check.applicationId);
  if (!app) return <LinkExpired state="invalid" />;

  const paid = ["received", "processing", "missing_info", "future_pending", "delivered", "refunded"].includes(
    app.status,
  );
  if (check.status === "used" || paid) {
    return paid ? <AlreadyPaid app={app} /> : <LinkExpired state="used" />;
  }
  if (app.status === "cancelled") return <LinkExpired state="expired" />;

  const config = await getStateConfig(app.stateSlug);
  const license = config?.licenses.find((l) => l.id === app.licenseId);
  const stateName =
    config?.stateName ??
    app.stateSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  const firstName = app.firstName ?? "";
  const lastInitial = app.lastName ? `${app.lastName.charAt(0).toUpperCase()}.` : "";
  const amount = app.amountCents / 100;

  return (
    <>
      <Hero
        title={`Complete your ${stateName} fishing license payment`}
        subtitle="Your application is saved — one quick payment and our team takes it from there."
      />
      <section className="py-12 sm:py-14">
        <div className="container-site grid max-w-4xl gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Card>
              <div className="px-6 py-6">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  Order summary
                </h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Reference</dt>
                    <dd className="font-mono font-semibold text-navy">{app.reference}</dd>
                  </div>
                  {(firstName || lastInitial) && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Applicant</dt>
                      <dd className="font-medium text-navy">
                        {firstName} {lastInitial}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">License</dt>
                    <dd className="text-right font-medium text-navy">
                      {license?.name ?? app.licenseId}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">State</dt>
                    <dd className="font-medium text-navy">{stateName}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-slate-200 pt-3">
                    <dt className="font-semibold text-navy">Total</dt>
                    <dd className="text-lg font-bold text-navy">{formatPrice(amount)}</dd>
                  </div>
                </dl>
                <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
                  Fully refundable until your license purchase is completed. ReelPermit is a
                  private license-assistance service, not a government agency.
                </p>
              </div>
            </Card>
          </div>
          <div className="lg:col-span-3">
            <RetryCheckout
              retryToken={params.token}
              total={amount}
              stateName={stateName}
              reference={app.reference}
              email={app.email}
            />
          </div>
        </div>
      </section>
    </>
  );
}
