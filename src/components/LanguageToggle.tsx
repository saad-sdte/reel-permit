"use client";

import { useLocale } from "@/i18n/LocaleProvider";

export function LanguageToggle({
  className = "",
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const { locale, setLocale } = useLocale();
  const onDark = tone === "dark";

  return (
    <div
      className={`inline-flex items-center rounded-md border p-0.5 ${
        onDark ? "border-white/25" : "border-ink-200"
      } ${className}`}
      role="group"
      aria-label="Language"
    >
      {(["en", "es"] as const).map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            onClick={() => setLocale(code)}
            className={[
              "rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide",
              active
                ? onDark
                  ? "bg-white text-navy"
                  : "bg-navy text-white"
                : onDark
                  ? "text-white/70 hover:text-white"
                  : "text-ink/50 hover:text-ink",
            ].join(" ")}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
