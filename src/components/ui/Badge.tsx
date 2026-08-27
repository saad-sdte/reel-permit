import type { ReactNode } from "react";

type Tone = "navy" | "forest" | "slate" | "amber";

const tones: Record<Tone, string> = {
  navy: "bg-navy-50 text-navy border-navy-100",
  forest: "bg-forest-50 text-forest-700 border-forest-100",
  slate: "bg-slate-100 text-slate-600 border-slate-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
};

export function Badge({
  tone = "navy",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
