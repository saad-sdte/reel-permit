import type { Metadata } from "next";
import { LegalContactBlock } from "@/components/LegalContactBlock";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "ReelPermit's refund policy: full refunds before we purchase your license, why payments are generally non-refundable after purchase, our-error corrections, and how to request a refund.",
};

const EFFECTIVE_DATE = "July 19, 2026";
const LAST_UPDATED = "July 19, 2026";

const TOC = [
  { id: "before-purchase", label: "1. Cancel before we purchase" },
  { id: "cannot-complete", label: "2. If we cannot complete your order" },
  { id: "after-purchase", label: "3. After your license is purchased" },
  { id: "our-error", label: "4. If we make an error" },
  { id: "incorrect-info", label: "5. Errors from incorrect application data" },
  { id: "duplicate", label: "6. Duplicate payments" },
  { id: "how-to-request", label: "7. How to request a refund" },
  { id: "timing", label: "8. Refund processing time" },
  { id: "chargebacks", label: "9. Chargebacks" },
  { id: "contact", label: "10. Contact" },
];

export default function RefundPage() {
  return (
    <>
      <section className="bg-navy py-16 text-white sm:py-20">
        <div className="container-site max-w-3xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Refund Policy</h1>
          <p className="mt-4 text-slate-300">
            Effective date: {EFFECTIVE_DATE} &middot; Last updated: {LAST_UPDATED}
          </p>
          <p className="mt-4 max-w-2xl text-slate-300">
            A fair refund policy in plain language: what is refundable, when, and exactly
            how to make a request.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site max-w-3xl space-y-10 leading-relaxed text-slate-600">
          <div className="rounded-xl border border-forest-200 bg-forest-50 px-6 py-5">
            <h2 className="text-base font-semibold text-navy">The short version</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>
                Cancel <strong className="text-navy">before</strong> we purchase your
                license from the state: full refund of everything you paid.
              </li>
              <li>
                We cannot complete your order, or we make the error: full refund, or a free
                correction where the state allows one.
              </li>
              <li>
                After we purchase: payments are generally non-refundable because state
                agencies do not refund issued licenses and the service has been performed.
              </li>
              <li>
                Duplicate charge: refunded in full. Approved refunds reach your bank in
                5&ndash;10 business days.
              </li>
            </ul>
          </div>

          <nav
            aria-label="Table of contents"
            className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-card"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-navy">
              On this page
            </p>
            <ol className="mt-3 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
              {TOC.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="text-sm font-medium text-forest-700 underline decoration-forest-200 underline-offset-2 hover:text-forest-800"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <section id="before-purchase" className="scroll-mt-28">
            <h2 className="text-xl font-bold">1. Cancel before we purchase</h2>
            <p className="mt-3">
              You may cancel your application for a full refund at any time{" "}
              <strong className="text-navy">before we complete the purchase</strong> of your
              license on the official state portal. On cancellation before purchase, we
              refund 100% of what you paid to your original payment method.
            </p>
            <p className="mt-3">
              We typically fulfill orders within 24 hours of submission, so please send
              cancellation requests as soon as possible — ideally within 24 hours of
              submitting your application. Every order confirmation email includes your
              reference number and the support address for exactly this purpose. Once the
              state purchase is complete, Section 3 applies instead.
            </p>
          </section>

          <section id="cannot-complete" className="scroll-mt-28">
            <h2 className="text-xl font-bold">2. If we cannot complete your order</h2>
            <p className="mt-3">
              If we are unable to purchase your license for any reason on our side — for
              example, a state system outage that prevents completion, an application we
              cannot process as submitted, or a rejection caused by our error — you receive
              a{" "}
              <strong className="text-navy">full refund of all amounts paid</strong>.
              We will always tell you
              why the order could not be completed.
            </p>
          </section>

          <section id="after-purchase" className="scroll-mt-28">
            <h2 className="text-xl font-bold">3. After your license is purchased</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>
                <strong className="text-navy">Payments are non-refundable once
                the license is purchased.</strong> State agencies do not refund issued
                licenses to us, so we cannot return those amounts to you. Where a state does
                allow a refund, void, or correction in a specific situation, we will pursue
                it on your behalf and pass through whatever the state returns.
              </li>
              <li>
                <strong className="text-navy">Our service is non-refundable after
                purchase</strong>, because the service — review, submission, purchase, and
                delivery — has been performed. The exception is our own error, covered in
                Section 4.
              </li>
            </ul>
          </section>

          <section id="our-error" className="scroll-mt-28">
            <h2 className="text-xl font-bold">4. If we make an error</h2>
            <p className="mt-3">
              If your license is purchased incorrectly because of our mistake — for example,
              the wrong license type or wrong validity dates relative to your confirmed
              order — we will make it right at no cost to you:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>
                we will request a correction or re-issuance from the state agency at no
                additional charge, where the state permits it; and
              </li>
              <li>
                if a correction is not possible, we will refund you in full — every dollar
                you paid us that was not already delivered to the state for a correct
                license, plus anything we can recover from the state.
              </li>
            </ul>
          </section>

          <section id="incorrect-info" className="scroll-mt-28">
            <h2 className="text-xl font-bold">5. Errors from incorrect application data</h2>
            <p className="mt-3">
              If a license is issued incorrectly because of inaccurate information in the
              application you submitted, contact us immediately. Where the state permits
              corrections or re-issuance, we will handle the process for you at no
              additional service charge (any fee the state itself charges for re-issuance is
              passed on to you). Refunds in these cases depend on the state
              agency&apos;s own policies, which generally do not allow refunds for
              customer-caused errors.
            </p>
          </section>

          <section id="duplicate" className="scroll-mt-28">
            <h2 className="text-xl font-bold">6. Duplicate payments</h2>
            <p className="mt-3">
              If a technical error causes your payment method to be charged more than once
              for the same order, the duplicate charge is refunded in full. Duplicate
              charges are normally identified and reversed automatically; if you spot one
              first, email us and we will confirm and refund it.
            </p>
          </section>

          <section id="how-to-request" className="scroll-mt-28">
            <h2 className="text-xl font-bold">7. How to request a refund</h2>
            <p className="mt-3">
              Email{" "}
              <a
                href="mailto:support@reelpermit.local"
                className="font-medium text-forest-700 underline"
              >
                support@reelpermit.local
              </a>{" "}
              with:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>
                your order reference number (it starts with &ldquo;RP-&rdquo; and appears in
                your confirmation email);
              </li>
              <li>the email address used on the application; and</li>
              <li>a brief description of what you are requesting and why.</li>
            </ul>
            <p className="mt-3">
              We review every request individually and respond within two business days.
            </p>
          </section>

          <section id="timing" className="scroll-mt-28">
            <h2 className="text-xl font-bold">8. Refund processing time</h2>
            <p className="mt-3">
              Approved refunds are issued to your original payment method within two
              business days of approval. Depending on your bank or card issuer, the credit
              typically appears within{" "}
              <strong className="text-navy">5&ndash;10 business days</strong>. We will email
              you a confirmation when the refund is issued.
            </p>
          </section>

          <section id="chargebacks" className="scroll-mt-28">
            <h2 className="text-xl font-bold">9. Chargebacks</h2>
            <p className="mt-3">
              Please contact us before filing a chargeback with your bank — most issues are
              resolved faster and at no cost through our support team. We contest
              unwarranted chargebacks using the application, authorization, and delivery
              records we retain, as permitted by card-network rules.
            </p>
          </section>

          <section id="contact" className="scroll-mt-28">
            <h2 className="text-xl font-bold">10. Contact</h2>
            <p className="mt-3">Refund requests and questions:</p>
            <LegalContactBlock />
          </section>
        </div>
      </section>
    </>
  );
}
