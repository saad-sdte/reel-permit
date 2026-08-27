import { Info } from "lucide-react";
import { NON_AFFILIATION_DISCLAIMER } from "@/lib/disclaimer";

export { NON_AFFILIATION_DISCLAIMER };

export function DisclaimerBanner({ className = "" }: { className?: string }) {
  return (
    <div
      role="note"
      aria-label="Non-affiliation notice"
      className={`border border-ink-200 bg-ink-50 px-5 py-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-copper" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-ink/80">{NON_AFFILIATION_DISCLAIMER}</p>
      </div>
    </div>
  );
}
