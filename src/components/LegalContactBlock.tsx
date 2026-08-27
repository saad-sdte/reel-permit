import type { ReactNode } from "react";

const SUPPORT_EMAIL = "support@reelpermit.local";

export function LegalContactBlock({ emailNote }: { emailNote?: ReactNode }) {
  return (
    <div className="mt-3 border border-ink-200 bg-ink-50 px-6 py-5">
      <p>
        <span className="font-semibold text-navy">Contact:</span> Customer Support
      </p>
      <p className="mt-2">
        <span className="font-semibold text-navy">Email:</span>{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-copper underline">
          {SUPPORT_EMAIL}
        </a>
        {emailNote ? <> {emailNote}</> : null}
      </p>
      <p className="mt-2">
        <span className="font-semibold text-navy">Mail:</span> 500 4TH ST NW, SUITE 102,
        ALBUQUERQUE, NM 87102, USA
      </p>
    </div>
  );
}
