import type { Metadata } from "next";
import { LegalContactBlock } from "@/components/LegalContactBlock";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How ReelPermit collects, uses, protects, retains, and deletes your personal information — including Social Security numbers — and the privacy rights you can exercise.",
};

const EFFECTIVE_DATE = "July 19, 2026";
const LAST_UPDATED = "July 19, 2026";

const TOC = [
  { id: "who-we-are", label: "1. Who we are" },
  { id: "information-we-collect", label: "2. Information we collect" },
  { id: "how-we-use", label: "3. How and why we use your information" },
  { id: "ssn", label: "4. Social Security numbers" },
  { id: "sharing", label: "5. How we share your information" },
  { id: "retention", label: "6. Data retention" },
  { id: "security", label: "7. How we protect your information" },
  { id: "your-rights", label: "8. Your rights and choices" },
  { id: "california", label: "9. California privacy rights" },
  { id: "cookies", label: "10. Cookies and analytics" },
  { id: "children", label: "11. Children\u2019s privacy" },
  { id: "changes", label: "12. Changes to this policy" },
  { id: "contact", label: "13. Contact us" },
];

export default function PrivacyPage() {
  return (
    <>
      <section className="bg-navy py-16 text-white sm:py-20">
        <div className="container-site max-w-3xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Privacy Policy</h1>
          <p className="mt-4 text-slate-300">
            Effective date: {EFFECTIVE_DATE} &middot; Last updated: {LAST_UPDATED}
          </p>
          <p className="mt-4 max-w-2xl text-slate-300">
            This policy explains what personal information ReelPermit collects, why we
            collect it, how we protect and retain it, and the rights and choices you have.
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

          <section id="who-we-are" className="scroll-mt-28">
            <h2 className="text-xl font-bold">1. Who we are</h2>
            <p className="mt-3">
              ReelPermit (&ldquo;ReelPermit,&rdquo; &ldquo;we,&rdquo;
              &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is a privately owned
              license-assistance service. We are not a government agency, and we are not
              affiliated with, endorsed by, or operated by any government agency. When you
              place an order, our team purchases your fishing license from the official
              state licensing portal on your behalf. For the purposes of applicable privacy
              laws, ReelPermit is the data controller (or &ldquo;business&rdquo;)
              responsible for the personal information described in this policy.
            </p>
          </section>

          <section id="information-we-collect" className="scroll-mt-28">
            <h2 className="text-xl font-bold">2. Information we collect</h2>
            <h3 className="mt-4 text-base font-semibold text-navy">
              2.1 Information you provide
            </h3>
            <p className="mt-2">
              When you complete an application, we collect the information your chosen
              state&apos;s official licensing portal requires, which may include:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>
                <strong className="text-navy">Identity data</strong> — full legal name,
                date of birth, residency status, identification details (such as a
                driver&apos;s license or state ID number), and physical descriptors where
                the state requires them.
              </li>
              <li>
                <strong className="text-navy">Social Security number (SSN)</strong> — only
                where the state requires it to issue a license. See Section 4.
              </li>
              <li>
                <strong className="text-navy">Contact data</strong> — email address,
                telephone number, and mailing and residential address.
              </li>
              <li>
                <strong className="text-navy">License choices</strong> — the license types,
                add-ons, validity dates, and options you select.
              </li>
              <li>
                <strong className="text-navy">Payment data</strong> — billing details needed
                to process your payment. Card numbers are processed by our payment
                processor; we do not store full card numbers on our systems.
              </li>
            </ul>
            <h3 className="mt-4 text-base font-semibold text-navy">2.2 Technical data</h3>
            <p className="mt-2">
              When you visit the site, we automatically receive standard technical
              information such as your IP address, browser type, device characteristics, and
              pages visited. We use this only for security, fraud prevention, and
              troubleshooting.
            </p>
          </section>

          <section id="how-we-use" className="scroll-mt-28">
            <h2 className="text-xl font-bold">3. How and why we use your information</h2>
            <p className="mt-3">
              We use personal information only for the following purposes, each with its
              legal basis where applicable law requires one:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>
                <strong className="text-navy">Fulfilling your order</strong> — reviewing
                your application and purchasing your license through the official state
                portal on your behalf, then delivering your license confirmation by email.
                (Performance of our contract with you.)
              </li>
              <li>
                <strong className="text-navy">Customer support</strong> — responding to your
                questions, corrections, cancellations, and refund requests. (Performance of
                our contract; our legitimate interest in operating a responsive service.)
              </li>
              <li>
                <strong className="text-navy">Legal compliance</strong> — record-keeping,
                tax and accounting obligations, and responding to lawful requests from
                authorities. (Legal obligation.)
              </li>
              <li>
                <strong className="text-navy">Security and fraud prevention</strong> —
                protecting the service and our customers. (Legitimate interest; legal
                obligation.)
              </li>
              <li>
                <strong className="text-navy">Service improvement</strong> — using
                aggregated, de-identified data only. (Legitimate interest.)
              </li>
            </ul>
            <p className="mt-3">
              <strong className="text-navy">We do not sell your personal information</strong>
              , we do not share it with third parties for their own marketing, and we do not
              use it to build advertising profiles.
            </p>
          </section>

          <section id="ssn" className="scroll-mt-28">
            <h2 className="text-xl font-bold">4. Social Security numbers</h2>
            <p className="mt-3">
              Certain states require an SSN to issue a fishing license, often because
              federal and state laws tie license issuance to child-support enforcement. When
              your state requires it, we handle your SSN under these rules:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>It is transmitted only over encrypted (TLS) connections.</li>
              <li>
                It is masked in every display: our team tooling, emails, and confirmations
                show only the last four digits (for example,{" "}
                <span className="font-mono">***-**-6789</span>). We never email or display a
                full SSN.
              </li>
              <li>
                It is never written to application logs, error reports, or analytics tools.
              </li>
              <li>
                It is stored only where strictly necessary to process your order, and any
                persistent storage adapter we operate is required to encrypt application
                data — including SSNs — at rest.
              </li>
              <li>
                It is used solely to complete your license purchase on the official state
                portal, and access is limited to the team members processing your
                application.
              </li>
              <li>It is never sold, rented, or shared for marketing purposes.</li>
            </ul>
            <p className="mt-3">
              If you prefer not to provide your SSN to us, you can purchase your license
              directly from the official state portal instead — every state page on this
              site links to it.
            </p>
          </section>

          <section id="sharing" className="scroll-mt-28">
            <h2 className="text-xl font-bold">5. How we share your information</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>
                <strong className="text-navy">State licensing agencies.</strong> To fulfill
                your order, we submit your application details — including your SSN where
                required — to the official state licensing portal operated by or for the
                state fish and wildlife agency. Once submitted, that agency&apos;s own
                privacy policies govern its handling of your information; we link to the
                official portal on every state page so you can review them.
              </li>
              <li>
                <strong className="text-navy">Service providers.</strong> A small number of
                vendors help us operate the service — for example, transactional email
                delivery, payment processing, website hosting, and security monitoring.
                These providers process personal information only on our documented
                instructions and are bound by contractual confidentiality and security
                obligations. Sensitive identifiers are masked before being included in any
                email or support artifact.
              </li>
              <li>
                <strong className="text-navy">Legal and safety.</strong> We may disclose
                information if required to do so by law, subpoena, or court order, or where
                necessary to protect rights, property, or safety and to prevent fraud.
              </li>
              <li>
                <strong className="text-navy">Business transfers.</strong> If we are
                involved in a merger, acquisition, or sale of assets, personal information
                may be transferred as part of that transaction. We will notify you before
                your information becomes subject to a different privacy policy.
              </li>
            </ul>
          </section>

          <section id="retention" className="scroll-mt-28">
            <h2 className="text-xl font-bold">6. Data retention</h2>
            <p className="mt-3">
              We retain your application data for up to{" "}
              <strong className="text-navy">24 months</strong> after your order is completed
              so that we can provide support, process corrections and refunds, and maintain
              business records. At the end of that period, the data is securely deleted or
              de-identified, unless a longer retention period is required by law (for
              example, tax and accounting rules) or is necessary to resolve a dispute or
              enforce an agreement. You may request earlier deletion at any time (see
              Section 8); we will honor it unless a legal obligation requires us to retain
              specific records.
            </p>
          </section>

          <section id="security" className="scroll-mt-28">
            <h2 className="text-xl font-bold">7. How we protect your information</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>TLS encryption for all data in transit between your browser, our systems, and the state portals.</li>
              <li>Field-level masking of sensitive identifiers in every interface, email, and log we produce.</li>
              <li>Encryption at rest for stored application data.</li>
              <li>Access limited to team members who need it to process your order, under confidentiality obligations.</li>
              <li>Administrative, technical, and physical safeguards that we review as the service evolves.</li>
            </ul>
            <p className="mt-3">
              No method of transmission or storage is completely secure, and we cannot
              guarantee absolute security. If we become aware of a data breach affecting
              your personal information, we will notify you and the relevant authorities as
              required by applicable law.
            </p>
          </section>

          <section id="your-rights" className="scroll-mt-28">
            <h2 className="text-xl font-bold">8. Your rights and choices</h2>
            <p className="mt-3">
              Depending on your state of residence, you may have the right to:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>access the personal information we hold about you and receive a copy;</li>
              <li>correct inaccurate or incomplete information;</li>
              <li>request deletion of your personal information;</li>
              <li>receive your information in a portable format; and</li>
              <li>object to or restrict certain processing.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email{" "}
              <a
                href="mailto:support@reelpermit.local"
                className="font-medium text-forest-700 underline"
              >
                support@reelpermit.local
              </a>{" "}
              with the subject line &ldquo;Privacy request&rdquo; from the email address on
              your application. We may need to verify your identity before acting on a
              request, and we will respond within the timeframe required by applicable law
              (generally 30 to 45 days).
            </p>
          </section>

          <section id="california" className="scroll-mt-28">
            <h2 className="text-xl font-bold">9. California privacy rights</h2>
            <p className="mt-3">
              If you are a California resident, the California Consumer Privacy Act, as
              amended by the CPRA (&ldquo;CCPA&rdquo;), gives you specific rights:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>
                <strong className="text-navy">Right to know and access</strong> — the
                categories and specific pieces of personal information we have collected
                about you, the sources, the purposes, and the categories of third parties
                we disclose it to.
              </li>
              <li>
                <strong className="text-navy">Right to correct</strong> — inaccurate
                personal information we hold about you.
              </li>
              <li>
                <strong className="text-navy">Right to delete</strong> — your personal
                information, subject to legal exceptions (such as transaction records we
                must keep).
              </li>
              <li>
                <strong className="text-navy">Right to opt out of sale or sharing</strong> —
                we do not sell personal information, and we do not share it for
                cross-context behavioral advertising, so there is nothing to opt out of.
              </li>
              <li>
                <strong className="text-navy">Right to limit use of sensitive personal
                information</strong> — we use sensitive identifiers such as your SSN only to
                perform the service you requested, which the CCPA permits without an
                opt-out.
              </li>
              <li>
                <strong className="text-navy">Right to non-discrimination</strong> — we will
                not treat you differently for exercising any of these rights.
              </li>
            </ul>
            <p className="mt-3">
              To exercise a CCPA right, contact us as described in Section 8. You may also
              use an authorized agent, subject to verification. We will respond within 45
              days as the CCPA requires.
            </p>
          </section>

          <section id="cookies" className="scroll-mt-28">
            <h2 className="text-xl font-bold">10. Cookies and analytics</h2>
            <p className="mt-3">
              The site uses essential cookies and similar technologies required for core
              functionality — for example, keeping your application session working and
              protecting against abuse. We also use Google Ads (gtag.js) conversion tags so
              we can measure whether advertising led to a completed purchase. Those tags
              may set or read advertising cookies when Google&apos;s scripts load, and a
              purchase conversion event is sent when your paid application is confirmed
              (including your order reference and amount). We do not sell your browsing
              data. You can set your browser to refuse cookies or use Google&apos;s ad
              settings to limit personalized advertising; essential site features may not
              function without essential cookies.
            </p>
          </section>

          <section id="children" className="scroll-mt-28">
            <h2 className="text-xl font-bold">11. Children&apos;s privacy</h2>
            <p className="mt-3">
              Our service is not directed to children under 13, and we do not knowingly
              collect personal information from them. Youth fishing license applications
              must be submitted by a parent or legal guardian acting on the child&apos;s
              behalf. If you believe a child has provided us personal information, contact
              us and we will delete it.
            </p>
          </section>

          <section id="changes" className="scroll-mt-28">
            <h2 className="text-xl font-bold">12. Changes to this policy</h2>
            <p className="mt-3">
              We may update this policy from time to time. The current version is always
              posted on this page with its &ldquo;last updated&rdquo; date, and material
              changes will be highlighted on the site before they take effect. Your
              continued use of the service after a change takes effect constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section id="contact" className="scroll-mt-28">
            <h2 className="text-xl font-bold">13. Contact us</h2>
            <p className="mt-3">
              For privacy questions or to exercise any right described in this policy:
            </p>
            <LegalContactBlock emailNote={<>(subject line: &ldquo;Privacy request&rdquo;)</>} />
          </section>
        </div>
      </section>
    </>
  );
}
