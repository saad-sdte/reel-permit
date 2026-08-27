import type { Metadata } from "next";
import Link from "next/link";
import { getAllStateConfigs } from "@/lib/states";
import { InnerPage } from "@/components/InnerPage";
import { buttonClasses } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Official MDNR site",
  description: "Buy a Michigan fishing license directly from the official MDNR portal if you prefer.",
};

export default async function OfficialSitesPage() {
  const states = await getAllStateConfigs();
  const mi = states[0];

  return (
    <InnerPage kicker="Official" title="Buy directly from Michigan DNR">
      <p className="text-lg">
        ReelPermit is optional. Michigan DNR sells the same licenses on their portal, usually for less
        if you file yourself.
      </p>
      {mi && (
        <div className="mt-8 border border-ink-200 p-6">
          <p className="font-sans text-2xl font-bold text-navy">{mi.officialAgencyName}</p>
          <p className="mt-2 text-ink/60">{mi.officialPortalName}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={mi.officialPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("outline", "md")}
            >
              Open MDNR portal
            </a>
            <Link href="/apply" className={buttonClasses("primary", "md")}>
              File with ReelPermit
            </Link>
          </div>
        </div>
      )}
    </InnerPage>
  );
}
