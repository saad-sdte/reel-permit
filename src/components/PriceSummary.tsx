import type { StateConfig } from "@/lib/state-config";
import { addOnsForLicense, displayPrice } from "@/lib/state-config";
import { formatPrice } from "@/lib/format";
import { Card } from "@/components/ui/Card";

/**
 * Price summary: one bundled total.
 *
 * Every price shown here has the global markup applied via displayPrice()
 * (see PRICE_MARKUP in src/lib/state-config.ts). HONESTY RULE: marked-up
 * prices must never be labeled "official fee" / "state fee", and there is no
 * separate service-fee line — our margin is inside the single total.
 */
export function PriceSummary({
  config,
  licenseId,
  addOnIds,
  className = "",
}: {
  config: StateConfig;
  licenseId?: string;
  addOnIds?: string[];
  className?: string;
}) {
  const license = config.licenses.find((l) => l.id === licenseId);
  const applicable = addOnsForLicense(config, licenseId || undefined);
  const selectedAddOns = applicable.filter(
    (a) => a.required || (addOnIds ?? []).includes(a.id),
  );

  const licensePrice = license ? displayPrice(license.price) : 0;
  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + displayPrice(a.price), 0);
  const total = licensePrice + addOnsTotal;

  return (
    <Card className={`bg-navy-50/60 ${className}`}>
      <div className="px-5 py-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-navy">
          Price summary
        </h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-slate-600">
              License{license ? `: ${license.name}` : ""}
            </dt>
            <dd className="font-medium text-navy">
              {license ? formatPrice(licensePrice) : "—"}
            </dd>
          </div>
          {selectedAddOns.length > 0 && (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-600">
                Add-ons: {selectedAddOns.map((a) => a.name).join(", ")}
              </dt>
              <dd className="whitespace-nowrap font-medium text-navy">
                {formatPrice(addOnsTotal)}
              </dd>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between gap-4 border-t border-navy-100 pt-3">
            <dt className="font-semibold text-navy">Total due today</dt>
            <dd className="text-lg font-bold text-navy">
              {license ? formatPrice(total) : "—"}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          One clear total before you pay — no hidden fees. The total includes
          the license, any add-ons, and ReelPermit&rsquo;s application review,
          purchase handling, and support.
        </p>
      </div>
    </Card>
  );
}
