import { Clock, Info, Receipt, ShieldCheck } from "lucide-react";

/**
 * Slim assurance band rendered directly under the homepage hero.
 * Leads with honesty ("Not a government agency") as a trust signal.
 */
const ITEMS = [
  {
    icon: ShieldCheck,
    title: "Secure submission",
    caption: "256-bit SSL · SSN masked to last 4",
  },
  {
    icon: Receipt,
    title: "Transparent pricing",
    caption: "One clear total before you pay",
  },
  {
    icon: Clock,
    title: "Fast, human review",
    caption: "Most applications reviewed within 1 business day",
  },
  {
    icon: Info,
    title: "Not a government agency",
    caption: "A private assistance service",
  },
];

export function TrustStrip() {
  return (
    <section aria-label="Service assurances" className="border-b border-slate-200 bg-white">
      <div className="container-site grid gap-4 py-6 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-5 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-600">
              <item.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy">{item.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.caption}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
