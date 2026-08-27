import type { Metadata } from "next";
import Link from "next/link";
import { InnerPage } from "@/components/InnerPage";
import { buttonClasses } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About",
  description: "ReelPermit is a private Michigan fishing-license desk — not a government agency.",
};

export default function AboutPage() {
  return (
    <InnerPage kicker="About" title="About this service">
      <p className="text-lg leading-relaxed">
        ReelPermit is a private company that helps people obtain a Michigan fishing license. We purchase
        the official license on the MDNR eLicense portal using the information you provide.
      </p>
      <p className="mt-6 leading-relaxed">
        We do not issue licenses. The State of Michigan does. We are not affiliated with MDNR. The
        price you pay includes the state license plus our filing fee.
      </p>
      <Link href="/apply" className={`${buttonClasses("primary", "lg")} mt-8`}>
        Start application
      </Link>
    </InnerPage>
  );
}
