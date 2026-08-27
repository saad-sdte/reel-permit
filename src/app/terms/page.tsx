import type { Metadata } from "next";
import Link from "next/link";
import { LegalContactBlock } from "@/components/LegalContactBlock";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms governing ReelPermit's private license-assistance service: your authorization for us to act as your agent and purchase on your behalf, pricing, refunds, and limitations of liability.",
};

const EFFECTIVE_DATE = "July 19, 2026";
const LAST_UPDATED = "July 19, 2026";

const TOC = [
  { id: "the-service", label: "1. The service" },
  { id: "acceptance", label: "2. Acceptance of these terms" },
  { id: "authorization", label: "3. Authorization to act as your agent" },
  { id: "accuracy", label: "4. Accuracy of your information" },
  { id: "fees", label: "5. Fees and payment" },
  { id: "issuance", label: "6. License issuance and state decisions" },
  { id: "refunds", label: "7. Refunds and cancellations" },
  { id: "acceptable-use", label: "8. Acceptable use" },
  { id: "intellectual-property", label: "9. Intellectual property" },
  { id: "disclaimers", label: "10. Disclaimers" },
  { id: "liability", label: "11. Limitation of liability" },
  { id: "indemnification", label: "12. Indemnification" },
  { id: "governing-law", label: "13. Governing law and disputes" },
  { id: "changes", label: "14. Changes to these terms" },
  { id: "contact", label: "15. Contact" },
];

export default function TermsPage() {
  return (
    <>
      <section className="bg-navy py-16 text-white sm:py-20">
        <div className="container-site max-w-3xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Terms of Service</h1>
          <p className="mt-4 text-slate-300">
            Effective date: {EFFECTIVE_DATE} &middot; Last updated: {LAST_UPDATED}
          </p>
          <p className="mt-4 max-w-2xl text-slate-300">
            These terms govern your use of ReelPermit and the license-assistance
            service we provide. Please read them before submitting an application.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site max-w-3xl space-y-10 leading-relaxed text-slate-600">
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

          <section id="the-service" className="scroll-mt-28">
            <h2 className="text-xl font-bold">1. The service</h2>
            <p className="mt-3">
              ReelPermit (&ldquo;ReelPermit,&rdquo; &ldquo;we,&rdquo;
              &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is a privately owned
              license-assistance service. We help you prepare and submit a fishing license
              application, and — with your authorization — purchase the license from the
              official state licensing portal on your behalf as your agent.{" "}
              <strong className="text-navy">
                We are not a government agency and are not affiliated with, endorsed by, or
                operated by any government agency.
              </strong>{" "}
              Fishing licenses are also available directly from official state agencies,
              often at a lower cost. If you do not want application assistance, you can
              purchase directly from the state; every state page on this site links to the
              official portal.
            </p>
          </section>

          <section id="acceptance" className="scroll-mt-28">
            <h2 className="text-xl font-bold">2. Acceptance of these terms</h2>
            <p className="mt-3">
              By accessing this site or submitting an application, you agree to these Terms
              of Service, our{" "}
              <Link href="/privacy" className="font-medium text-forest-700 underline">
                Privacy Policy
              </Link>
              , and our{" "}
              <Link href="/refund" className="font-medium text-forest-700 underline">
                Refund Policy
              </Link>
              , each of which is incorporated by reference. If you do not agree, do not use
              the service. You must be at least 18 years old (or the age of majority in
              your state) to place an order; youth license applications must be submitted
              by a parent or legal guardian.
            </p>
          </section>

          <section id="authorization" className="scroll-mt-28">
            <h2 className="text-xl font-bold">3. Authorization to act as your agent</h2>
            <p className="mt-3">
              By submitting an application and completing payment, you appoint
              ReelPermit as your agent for the limited purpose of submitting your
              application and purchasing the license you selected from the applicable
              state agency on your behalf. This agency relationship includes:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>
                preparing and submitting your fishing license application to the official
                state licensing portal using the information you provided;
              </li>
              <li>
                purchasing the license and add-ons you selected on your behalf with the
                funds you provide; and
              </li>
              <li>
                receiving the state&apos;s confirmation and delivering it to you by email.
              </li>
            </ul>
            <p className="mt-3">
              This authorization is limited to the transaction you request. You confirm that
              you are the applicant (or the parent or legal guardian of the applicant), that
              you are authorized to provide the information submitted, and that it is
              accurate and complete.
            </p>
          </section>

          <section id="accuracy" className="scroll-mt-28">
            <h2 className="text-xl font-bold">4. Accuracy of your information</h2>
            <p className="mt-3">
              You are responsible for the accuracy and completeness of everything you
              submit, including identity details, residency declarations, and license
              selections. Providing false information on a license application may violate
              state law and can result in fines, license revocation, or prosecution by the
              state. We review applications for completeness and obvious errors, but we do
              not verify your information against state records, and our review does not
              transfer your responsibility to us. We may decline or cancel any application
              we reasonably believe contains false, misleading, or fraudulent information.
            </p>
          </section>

          <section id="fees" className="scroll-mt-28">
            <h2 className="text-xl font-bold">5. Fees and payment</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>
                <strong className="text-navy">One bundled total.</strong> The price shown
                for your license and add-ons — and the total quoted before you pay — is a
                single bundled price that includes our application review, purchase
                handling, license delivery, and customer support. There are no hidden
                fees: the total shown at checkout is the amount your card is charged.
              </li>
              <li>
                <strong className="text-navy">States set their own fees,</strong> which may
                change at any time. Our bundled price is not the state&apos;s fee and is
                not represented as such; it is the price of our license-assistance service,
                which includes obtaining the license on your behalf.
              </li>
              <li>
                All prices are in US dollars. Payment is collected when you place your
                order, and your card statement shows the descriptor &ldquo;ANGLER
                PERMIT&rdquo;.
              </li>
            </ul>
          </section>

          <section id="issuance" className="scroll-mt-28">
            <h2 className="text-xl font-bold">6. License issuance and state decisions</h2>
            <p className="mt-3">
              Only state agencies issue fishing licenses. Eligibility rules, residency
              definitions, issuance decisions, and processing times belong solely to the
              state.{" "}
              <strong className="text-navy">
                We do not guarantee that any license will be issued.
              </strong>{" "}
              A state may decline an application for reasons outside our control, including
              errors in the information you provided, ineligibility, outstanding state
              holds, or system outages. If the state rejects your application, we will
              notify you, explain the reason where the state provides one, and work with you
              on next steps under our{" "}
              <Link href="/refund" className="font-medium text-forest-700 underline">
                Refund Policy
              </Link>
              .
            </p>
          </section>

          <section id="refunds" className="scroll-mt-28">
            <h2 className="text-xl font-bold">7. Refunds and cancellations</h2>
            <p className="mt-3">
              Refunds and cancellations are governed by our{" "}
              <Link href="/refund" className="font-medium text-forest-700 underline">
                Refund Policy
              </Link>
              , which is incorporated into these terms. In summary: you may cancel for a
              full refund at any time before we complete the purchase on the state portal;
              after purchase, refunds are limited because state agencies generally do not
              refund issued licenses.
            </p>
          </section>

          <section id="acceptable-use" className="scroll-mt-28">
            <h2 className="text-xl font-bold">8. Acceptable use</h2>
            <p className="mt-3">You agree not to:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>
                submit an application for another person without their knowledge and
                authorization (parents and legal guardians acting for a minor excepted);
              </li>
              <li>
                misrepresent your identity, residency, eligibility, or any other material
                fact;
              </li>
              <li>use the service for any unlawful purpose or to commit fraud;</li>
              <li>
                attempt to disrupt, probe, reverse-engineer, or gain unauthorized access to
                the service or its systems;
              </li>
              <li>
                scrape, harvest, or reuse site content or state data compilations for a
                competing service; or
              </li>
              <li>use another person&apos;s payment method without authorization.</li>
            </ul>
            <p className="mt-3">
              We may suspend or refuse service to anyone who violates these rules.
            </p>
          </section>

          <section id="intellectual-property" className="scroll-mt-28">
            <h2 className="text-xl font-bold">9. Intellectual property</h2>
            <p className="mt-3">
              The site&apos;s design, text, graphics, logos, and code are owned by
              ReelPermit and protected by intellectual-property laws. You may not copy or
              redistribute them without our written permission. State agency names, license
              names, and portal names referenced on this site belong to their respective
              owners and are used for identification purposes only; such use does not imply
              any endorsement or affiliation.
            </p>
          </section>

          <section id="disclaimers" className="scroll-mt-28">
            <h2 className="text-xl font-bold">10. Disclaimers</h2>
            <p className="mt-3">
              The service is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; To
              the fullest extent permitted by law, we disclaim all warranties, express or
              implied, including warranties of merchantability, fitness for a particular
              purpose, and non-infringement. We do not warrant that the site will be
              uninterrupted or error-free, that state systems will be available, or that
              state-published information such as fees and requirements will remain
              unchanged.
            </p>
          </section>

          <section id="liability" className="scroll-mt-28">
            <h2 className="text-xl font-bold">11. Limitation of liability</h2>
            <p className="mt-3">
              To the fullest extent permitted by law, ReelPermit&apos;s total liability
              arising out of or relating to the service is limited to the total amount you
              paid us for the application at issue. We are not liable for indirect, incidental,
              special, consequential, or punitive damages, including lost fishing trips,
              lost profits, state penalties arising from inaccurate information you
              provided, or acts and omissions of state agencies. Some states do not allow
              certain limitations, so portions of this section may not apply to you.
            </p>
          </section>

          <section id="indemnification" className="scroll-mt-28">
            <h2 className="text-xl font-bold">12. Indemnification</h2>
            <p className="mt-3">
              You agree to indemnify, defend, and hold harmless ReelPermit and its owners,
              employees, and agents from and against any claims, liabilities, damages,
              losses, and expenses (including reasonable attorneys&apos; fees) arising out
              of or relating to (a) information you submit that is false, inaccurate, or
              unauthorized, (b) your violation of these terms, or (c) your violation of any
              law or the rights of any third party, including state licensing rules.
            </p>
          </section>

          <section id="governing-law" className="scroll-mt-28">
            <h2 className="text-xl font-bold">13. Governing law and disputes</h2>
            <p className="mt-3">
              These terms are governed by the laws of the State of Delaware, without regard
              to conflict-of-laws principles. Any dispute arising out of or relating to
              these terms or the service will be brought exclusively in the state or federal
              courts located in Delaware, and the parties consent to their jurisdiction —
              except that either party may bring an individual claim in small-claims court
              where eligible. Nothing in this section limits any non-waivable rights you
              have under the consumer-protection laws of your state of residence.
            </p>
          </section>

          <section id="changes" className="scroll-mt-28">
            <h2 className="text-xl font-bold">14. Changes to these terms</h2>
            <p className="mt-3">
              We may update these terms from time to time. The current version is always
              posted on this page with its effective date, and material changes will be
              highlighted on the site before they take effect. Your continued use of the
              service after a change takes effect constitutes acceptance of the updated
              terms. If you do not agree to a change, stop using the service and contact us
              about any pending order.
            </p>
          </section>

          <section id="contact" className="scroll-mt-28">
            <h2 className="text-xl font-bold">15. Contact</h2>
            <p className="mt-3">Questions about these terms:</p>
            <LegalContactBlock />
          </section>
        </div>
      </section>
    </>
  );
}
