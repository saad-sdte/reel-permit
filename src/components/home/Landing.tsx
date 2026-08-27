import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { FAQ_ITEMS } from "@/data/faq";
import { config } from "@/data/states/michigan";
import { formatPrice } from "@/lib/format";
import { displayPrice } from "@/lib/state-config";
import { HeroSection } from "@/components/motion/HeroSection";
import { LicenseCards } from "@/components/motion/LicenseCards";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/contact";

const FEATURED = [
  {
    id: "daily-all-species",
    name: "1-day all species",
    who: "Resident or visitor · 24 hours",
  },
  {
    id: "annual-all-species-resident",
    name: "Resident annual",
    who: "Michigan resident · season",
  },
  {
    id: "annual-all-species-nonresident",
    name: "Nonresident annual",
    who: "Out of state · season",
  },
  {
    id: "hunt-fish-combo-resident",
    name: "Hunt & fish combo",
    who: "Michigan resident · hunt + fish",
  },
] as const;

export function Landing() {
  const featured = FEATURED.map((row) => {
    const license = config.licenses.find((item) => item.id === row.id);
    return {
      ...row,
      price: license ? displayPrice(license.price) : 0,
    };
  });
  const dayPrice = formatPrice(featured[0].price);
  const annualPrice = formatPrice(featured[1].price);

  return (
    <>
      <HeroSection dayPrice={dayPrice} annualPrice={annualPrice} />

      <section className="border-b border-ink-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:grid-cols-3 sm:px-6">
          {[
            ["Official document", "The license comes from MDNR. We never print a substitute."],
            ["A person files it", "Someone reviews your file, then purchases on the state portal."],
            ["Refundable until filed", "If we have not bought it yet, you get your money back."],
          ].map(([title, body], i) => (
            <div key={title} data-aos="fade-up" data-aos-delay={i * 90}>
              <h2 className="font-sans text-base font-semibold text-navy">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink/70">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="licenses" className="scroll-mt-24 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl" data-aos="fade-up">
            <h2 className="font-display text-3xl text-navy sm:text-4xl">Licenses we file</h2>
            <p className="mt-3 text-ink/70">
              Same MDNR products you would buy yourself. The price below is the bundled total —
              state license plus our filing work. MDNR sells the same licenses cheaper if you
              file on their portal.
            </p>
          </div>
          <LicenseCards items={[...featured]} />
          <p className="mt-4 text-sm text-ink/50" data-aos="fade-up">
            Nonresident short-term licenses (2–9 day) are on the application.{" "}
            <Link href="/apply" className="font-semibold text-copper underline-offset-2 hover:underline">
              Open the form
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-3xl text-navy sm:text-4xl" data-aos="fade-up">
            How it works
          </h2>
          <ol className="mt-10 grid gap-10 sm:grid-cols-3">
            {[
              ["You apply", "Residency, license, ID photos, and the details Michigan asks for. A few minutes if you have a license picture handy."],
              ["We file with MDNR", "A reviewer checks the packet, then purchases on mdnr-elicense.com — the same portal you could use yourself."],
              ["You get the license", "The state generates it. We email that file to you. Carry it on your phone or print it."],
            ].map(([title, body], i) => (
              <li key={title} data-aos="fade-up" data-aos-delay={i * 110}>
                <p className="font-mono text-sm font-semibold text-copper">0{i + 1}</p>
                <h3 className="mt-2 font-sans text-xl font-semibold text-navy">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{body}</p>
              </li>
            ))}
          </ol>
          <div data-aos="fade-up">
            <Link href="/how-it-works" className={`${buttonClasses("outline", "md")} mt-10`}>
              Full process
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-3xl text-navy sm:text-4xl" data-aos="fade-up">
            Straight answers
          </h2>
          <div className="mt-8 divide-y divide-ink-200 border-y border-ink-200">
            {FAQ_ITEMS.slice(0, 5).map((item, i) => (
              <details key={item.question} className="group py-4" data-aos="fade-up" data-aos-delay={i * 50}>
                <summary className="cursor-pointer list-none font-sans text-lg font-semibold text-navy">
                  {item.question}
                </summary>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink/70">{item.answer}</p>
              </details>
            ))}
          </div>
          <Link href="/faq" className="mt-6 inline-block text-sm font-semibold text-copper hover:underline" data-aos="fade-up">
            All questions
          </Link>
        </div>
      </section>

      <section className="bg-navy py-14 text-white" data-aos="fade-up">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="font-display text-3xl text-white">Ready to fish Michigan?</h2>
            <p className="mt-2 max-w-xl text-white/70">
              Independent service — not MDNR. Questions:{" "}
              <a href={SUPPORT_MAILTO} className="underline underline-offset-2">
                {SUPPORT_EMAIL}
              </a>
              . You can always buy the same license on the{" "}
              <Link href="/official-sites" className="underline underline-offset-2">
                official state site
              </Link>
              .
            </p>
          </div>
          <Link href="/apply" className={buttonClasses("primary", "lg")}>
            Start application
          </Link>
        </div>
      </section>
    </>
  );
}
