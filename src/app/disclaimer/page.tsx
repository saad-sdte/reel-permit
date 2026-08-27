import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { LegalContactBlock } from "@/components/LegalContactBlock";
import { NON_AFFILIATION_DISCLAIMER } from "@/components/ui/DisclaimerBanner";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "ReelPermit is a privately owned license-assistance service and is not affiliated with any government agency. Read our non-affiliation, accuracy, external-links, and trademark disclaimers.",
};

const EFFECTIVE_DATE = "July 19, 2026";
const LAST_UPDATED = "July 19, 2026";

const TOC = [
  { id: "non-affiliation", label: "1. No government affiliation" },
  { id: "official-sources", label: "2. Buy directly from the state" },
  { id: "state-portals", label: "3. Official state portals we serve" },
  { id: "accuracy", label: "4. Accuracy of information" },
  { id: "no-legal-advice", label: "5. Not legal advice" },
  { id: "external-links", label: "6. External links" },
  { id: "trademarks", label: "7. Trademarks" },
  { id: "contact", label: "8. Contact" },
];

const STATE_PORTALS = [
  {
    state: "Michigan",
    agency: "Michigan Department of Natural Resources",
    portalName: "Michigan DNR eLicense",
    portalUrl: "https://mdnr-elicense.com/",
    agencyUrl: "https://www.michigan.gov/dnr",
  },
  {
    state: "California",
    agency: "California Department of Fish and Wildlife",
    portalName: "CDFW Online License Sales and Services",
    portalUrl: "https://www.licenses.wildlife.ca.gov/InternetSales/",
    agencyUrl: "https://wildlife.ca.gov",
  },
  {
    state: "Texas",
    agency: "Texas Parks and Wildlife Department",
    portalName: "Texas License Connection",
    portalUrl: "https://www.txfgsales.com/",
    agencyUrl: "https://tpwd.texas.gov",
  },
  {
    state: "Colorado",
    agency: "Colorado Parks and Wildlife",
    portalName: "CPW Shop (IPAWS)",
    portalUrl: "https://www.cpwshop.com",
    agencyUrl: "https://cpw.state.co.us",
  },
  {
    state: "North Carolina",
    agency: "North Carolina Wildlife Resources Commission",
    portalName: "Go Outdoors North Carolina",
    portalUrl: "https://www.gooutdoorsnorthcarolina.com/",
    agencyUrl: "https://www.ncwildlife.org",
  },
  {
    state: "Florida",
    agency: "Florida Fish and Wildlife Conservation Commission",
    portalName: "Go Outdoors Florida",
    portalUrl: "https://gooutdoorsflorida.com/",
    agencyUrl: "https://myfwc.com",
  },
  {
    state: "South Carolina",
    agency: "South Carolina Department of Natural Resources",
    portalName: "Go Outdoors South Carolina",
    portalUrl: "https://gooutdoorssouthcarolina.com/",
    agencyUrl: "https://dnr.sc.gov",
  },
];

export default function DisclaimerPage() {
  return (
    <>
      <section className="bg-navy py-16 text-white sm:py-20">
        <div className="container-site max-w-3xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Disclaimer</h1>
          <p className="mt-4 text-slate-300">
            Effective date: {EFFECTIVE_DATE} &middot; Last updated: {LAST_UPDATED}
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site max-w-3xl space-y-10 leading-relaxed text-slate-600">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-5">
            <p className="text-base font-semibold leading-relaxed text-amber-900">
              {NON_AFFILIATION_DISCLAIMER}
            </p>
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

          <section id="non-affiliation" className="scroll-mt-28">
            <h2 className="text-xl font-bold">1. No government affiliation</h2>
            <p className="mt-3">
              ReelPermit is a privately owned and operated license-assistance service.
              We are not a government agency, and we are not affiliated with, endorsed by,
              sponsored by, approved by, or operated by any federal, state, or local
              government agency — including any state department of natural resources, fish
              and wildlife agency, or parks and wildlife department. Our name, logo, and
              site design are original and are not intended to resemble any government
              website, seal, or branding. Nothing on this site should be read as implying
              government status, and any such reading is expressly disclaimed.
            </p>
          </section>

          <section id="official-sources" className="scroll-mt-28">
            <h2 className="text-xl font-bold">2. Buy directly from the state</h2>
            <p className="mt-3">
              Fishing licenses are issued only by state agencies and are available directly
              from official state licensing portals —{" "}
              <strong className="text-navy">
                often at a lower cost, because you pay only the state&apos;s fees without
                our assistance charge
              </strong>
              . What we provide is convenience and support: a guided, error-checked
              application, purchase handling, delivery, and customer service, all included
              in one clear total. Whether that convenience is worth it is your choice, and
              we encourage you to compare before ordering. Every state page on this site
              links to the official portal it references.
            </p>
          </section>

          <section id="state-portals" className="scroll-mt-28">
            <h2 className="text-xl font-bold">3. Official state portals we serve</h2>
            <p className="mt-3">
              These are the official licensing portals and agency websites for the states we
              currently serve. We are not affiliated with any of them.
            </p>
            <ul className="mt-4 space-y-4">
              {STATE_PORTALS.map((s) => (
                <li
                  key={s.state}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-card"
                >
                  <p className="font-semibold text-navy">{s.state}</p>
                  <p className="mt-1 text-sm text-slate-500">{s.agency}</p>
                  <p className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <a
                      href={s.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-forest-700 underline decoration-forest-200 underline-offset-2 hover:text-forest-800"
                    >
                      Licensing portal: {s.portalName}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                    <a
                      href={s.agencyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-forest-700 underline decoration-forest-200 underline-offset-2 hover:text-forest-800"
                    >
                      Agency website
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section id="accuracy" className="scroll-mt-28">
            <h2 className="text-xl font-bold">4. Accuracy of information</h2>
            <p className="mt-3">
              License names, prices, eligibility rules, and application requirements on this
              site are researched against the official state portals and stamped with a
              &ldquo;last verified&rdquo; date on each state page. States can change their
              offerings, fees, and rules at any time without notice to us, so information on
              this site may become outdated between verifications.{" "}
              <strong className="text-navy">
                Always confirm current prices and requirements on the official state portal
                before relying on them.
              </strong>{" "}
              Where any discrepancy exists, the official state portal and the state&apos;s
              published regulations control. If we discover an error, we correct it and,
              where a submitted application is affected, we contact the applicant.
            </p>
          </section>

          <section id="no-legal-advice" className="scroll-mt-28">
            <h2 className="text-xl font-bold">5. Not legal advice</h2>
            <p className="mt-3">
              Content on this site is provided for general information and convenience only.
              It is not legal advice, and it does not replace the fishing regulations
              published by each state. You are responsible for knowing and following the
              rules of the state where you fish, including seasons, catch limits, gear
              restrictions, and stamp or endorsement requirements. If you need legal advice
              about your specific situation, consult a licensed attorney.
            </p>
          </section>

          <section id="external-links" className="scroll-mt-28">
            <h2 className="text-xl font-bold">6. External links</h2>
            <p className="mt-3">
              This site links to official state portals and other third-party websites for
              your convenience. We do not control and are not responsible for the content,
              availability, security, or privacy practices of third-party sites. Following a
              link is at your own discretion, and the third party&apos;s own terms and
              policies apply when you use its site.
            </p>
          </section>

          <section id="trademarks" className="scroll-mt-28">
            <h2 className="text-xl font-bold">7. Trademarks</h2>
            <p className="mt-3">
              &ldquo;ReelPermit&rdquo; and the ReelPermit logo are trademarks of
              ReelPermit. State names, agency names, license names, and portal names
              mentioned on this site are the trademarks or property of their respective
              owners. They are used for identification purposes only, to tell you which
              official systems our service interacts with, and their use does not imply any
              endorsement of, or affiliation with, ReelPermit.
            </p>
          </section>

          <section id="contact" className="scroll-mt-28">
            <h2 className="text-xl font-bold">8. Contact</h2>
            <p className="mt-3">Questions about this disclaimer:</p>
            <LegalContactBlock />
          </section>
        </div>
      </section>
    </>
  );
}
