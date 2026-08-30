import type { ComponentType } from "react";
import type { StateConfig } from "@/lib/state-config";

export function CompetitorApplyShell({
  slug,
  Wizard,
  config,
}: {
  slug: string;
  Wizard: ComponentType<{ config: StateConfig }>;
  advisorsSubtitle?: boolean;
  config: StateConfig;
}) {
  const agency = config.officialAgencyName;
  const portal = config.officialPortalName;

  return (
    <div className="bg-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:py-14">
        <aside className="lg:col-span-4" data-aos="fade-right">
          <p className="text-sm font-semibold tracking-wide text-copper">
            {config.stateName} fishing license
          </p>
          <h1 className="mt-2 font-display text-3xl text-navy sm:text-4xl">Application</h1>
          <p className="mt-4 leading-relaxed text-ink/75">
            Same official {agency} license. We complete the {portal} portal. You see one
            total before you pay.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-ink/70">
            <li className="border-l-2 border-copper pl-3">Refundable until we purchase</li>
            <li className="border-l-2 border-copper pl-3">Human review before filing</li>
            <li className="border-l-2 border-copper pl-3">License emailed after the agency issues it</li>
          </ul>
          <p className="mt-8 text-xs leading-relaxed text-ink/50">
            ReelPermit is not {agency}. You can buy the same license on the official {portal}{" "}
            portal, usually for less if you file yourself.
          </p>
        </aside>
        <div className="cl-apply min-w-0 lg:col-span-8" data-state={slug}>
          <Wizard config={config} />
        </div>
      </div>
    </div>
  );
}
