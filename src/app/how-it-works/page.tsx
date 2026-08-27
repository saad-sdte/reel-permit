import type { Metadata } from "next";
import Link from "next/link";
import { InnerPage } from "@/components/InnerPage";
import { buttonClasses } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "How it works",
  description: "How ReelPermit files a Michigan fishing license with MDNR on your behalf.",
};

export default function HowItWorksPage() {
  return (
    <InnerPage kicker="Process" title="How ReelPermit files your license">
      <ol className="space-y-10">
        {[
          ["1. You submit", "Residency, license type, ID photos, and the details MDNR requires."],
          ["2. ReelPermit files", "A person checks the file, then buys it on the official eLicense portal."],
          ["3. Michigan issues", "The state issues the license. We email the document they generated."],
        ].map(([h, b]) => (
          <li key={h}>
            <h2 className="font-sans text-2xl font-bold text-navy">{h}</h2>
            <p className="mt-2 text-lg leading-relaxed">{b}</p>
          </li>
        ))}
      </ol>
      <p className="mt-10 text-sm text-ink/60">
        Independent service. Not MDNR. Licenses are also sold on the state site, usually cheaper if you
        file yourself.
      </p>
      <Link href="/apply" className={`${buttonClasses("primary", "lg")} mt-8`}>
        Start application
      </Link>
    </InnerPage>
  );
}
