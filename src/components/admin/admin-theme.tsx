"use client";

import { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";
import type { PublicAdminUser } from "@/lib/admin-users";

export type AdminTheme = "light" | "dark";

const STORAGE_KEY = "ap_admin_theme";

type ThemeCtx = {
  theme: AdminTheme;
  setTheme: (theme: AdminTheme) => void;
  toggleTheme: () => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

type MeCtx = {
  me: PublicAdminUser | null;
  setMe: (user: PublicAdminUser | null) => void;
};

const MeContext = createContext<MeCtx | null>(null);

export function AdminSessionProvider({
  initialMe,
  children,
}: {
  initialMe?: PublicAdminUser | null;
  children: React.ReactNode;
}) {
  const [me, setMe] = useState<PublicAdminUser | null>(initialMe ?? null);
  return <MeContext.Provider value={{ me, setMe }}>{children}</MeContext.Provider>;
}

export function useAdminSession() {
  const ctx = useContext(MeContext);
  if (!ctx) return { me: null, setMe: () => undefined };
  return ctx;
}

function readStored(): AdminTheme {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
}

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>("light");

  useLayoutEffect(() => {
    const next = readStored();
    setThemeState(next);
    document.documentElement.setAttribute("data-admin-theme", next);
  }, []);

  const value = useMemo<ThemeCtx>(() => {
    const setTheme = (next: AdminTheme) => {
      setThemeState(next);
      window.localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.setAttribute("data-admin-theme", next);
    };
    return {
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
    };
  }, [theme]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminTheme must be used inside AdminThemeProvider");
  return ctx;
}
