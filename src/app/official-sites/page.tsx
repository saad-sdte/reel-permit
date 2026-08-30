import type { Metadata } from "next";
import Link from "next/link";
import { getAllStateConfigs } from "@/lib/states";
import { InnerPage } from "@/components/InnerPage";
import { buttonClasses } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Official state portals",
  description:
    "Buy a Michigan or Pennsylvania fishing license directly from the official state portal if you prefer.",
};

export default async function OfficialSitesPage() {
  const states = await getAllStateConfigs();

  return (
    <InnerPage kicker="Official" title="Buy directly from the state">
      <p className="text-lg">
        ReelPermit is optional. Official agencies sell the same licenses on their
        portals, usually for less if you file yourself.
      </p>
      <div className="mt-8 space-y-6">
        {states.map((state) => (
          <div key={state.slug} className="border border-ink-200 p-6">
            <p className="font-sans text-2xl font-bold text-navy">{state.stateName}</p>
            <p className="mt-1 text-ink/80">{state.officialAgencyName}</p>
            <p className="mt-2 text-ink/60">{state.officialPortalName}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={state.officialPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("outline", "md")}
              >
                Open official portal
              </a>
              <Link
                href={state.slug === "pennsylvania" ? "/pennsylvania" : "/apply"}
                className={buttonClasses("primary", "md")}
              >
                File with ReelPermit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </InnerPage>
  );
}
