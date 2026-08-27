"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { AosInit } from "@/components/motion/AosInit";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <LocaleProvider>
      <AosInit />
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </LocaleProvider>
  );
}
