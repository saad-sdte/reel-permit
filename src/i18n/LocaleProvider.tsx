"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  isLocale,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  translate,
  type Locale,
} from "@/i18n/messages";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function persistLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = locale;
}

/** Strip or add `/es` prefix to mirror competitor-style locale URLs. */
export function withLocalePrefix(pathname: string, locale: Locale): string {
  const path = pathname || "/";
  const stripped = path === "/es" ? "/" : path.replace(/^\/es(?=\/|$)/, "") || "/";
  if (locale === "es") {
    return stripped === "/" ? "/es" : `/es${stripped}`;
  }
  return stripped;
}

function localeFromPath(pathname: string): Locale {
  return pathname === "/es" || pathname.startsWith("/es/") ? "es" : "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const pathLocale = localeFromPath(pathname);
  const [locale, setLocaleState] = useState<Locale>(pathLocale);

  // Path is the source of truth (same as competitor /es/... URLs).
  useEffect(() => {
    setLocaleState(pathLocale);
    persistLocale(pathLocale);
  }, [pathLocale]);

  const setLocale = useCallback(
    (next: Locale) => {
      const target = withLocalePrefix(pathname, next);
      persistLocale(next);
      if (target !== pathname) {
        // Hard navigation: App Router soft nav can no-op when middleware
        // rewrites /es/foo → /foo (same destination page).
        window.location.assign(target);
        return;
      }
      setLocaleState(next);
    },
    [pathname],
  );

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return {
      locale: "en" as Locale,
      setLocale: () => {},
      t: (key: string, vars?: Record<string, string | number>) => translate("en", key, vars),
    };
  }
  return ctx;
}

/** @deprecated kept for callers that previously imported this helper */
export function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const fromStorage = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(fromStorage)) return fromStorage;
  } catch {
    /* ignore */
  }
  return "en";
}
