import type { Metadata } from "next";
import Link from "next/link";
import { InnerPage } from "@/components/InnerPage";
import { buttonClasses } from "@/components/ui/Button";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/contact";

export const metadata: Metadata = {
  title: "About",
  description: "ReelPermit is a fishing-license desk for Michigan and Pennsylvania.",
};

export default function AboutPage() {
  return (
    <InnerPage kicker="About" title="About this service">
      <p className="text-lg leading-relaxed">
        ReelPermit is a private company that helps people obtain a fishing license in
        Michigan or Pennsylvania. We purchase the official license on the state portal
        using the information you provide.
      </p>
      <p className="mt-6 leading-relaxed">
        We do not issue licenses. The state agency does. We are not affiliated with the
        Michigan DNR or the Pennsylvania Fish and Boat Commission. The price you pay
        includes the state license plus our filing work.
      </p>
      <p className="mt-6 leading-relaxed">
        Questions:{" "}
        <a href={SUPPORT_MAILTO} className="font-semibold text-copper underline">
          {SUPPORT_EMAIL}
        </a>
        .
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
