import type { Metadata } from "next";
import Link from "next/link";
import { InnerPage } from "@/components/InnerPage";
import { buttonClasses } from "@/components/ui/Button";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/contact";

export const metadata: Metadata = {
  title: "How it works",
  description: "How ReelPermit files a Michigan or Pennsylvania fishing license on the official state portal.",
};

export default function HowItWorksPage() {
  return (
    <InnerPage kicker="Process" title="How ReelPermit files your license">
      <ol className="space-y-10">
        {[
          ["1. You submit", "Residency, license type, identification, and the details the state agency requires."],
          ["2. ReelPermit files", "A person checks the file, then buys it on MDNR eLicense or HuntFishPA."],
          ["3. The state issues", "The agency issues the license. We email the document they generated."],
        ].map(([h, b]) => (
          <li key={h}>
            <h2 className="font-sans text-2xl font-bold text-navy">{h}</h2>
            <p className="mt-2 text-lg leading-relaxed">{b}</p>
          </li>
        ))}
      </ol>
      <p className="mt-10 text-sm text-ink/60">
        Licenses are also sold on official state sites, usually cheaper if you file
        yourself.{" "}
        <a href={SUPPORT_MAILTO} className="font-semibold text-copper underline">
          {SUPPORT_EMAIL}
        </a>
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/apply" className={buttonClasses("primary", "lg")}>
          Michigan application
        </Link>
        <Link href="/pennsylvania" className={buttonClasses("outline", "lg")}>
          Pennsylvania application
        </Link>
      </div>
    </InnerPage>
  );
}
