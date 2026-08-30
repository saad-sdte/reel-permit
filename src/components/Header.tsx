"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/contact";
import { useLocale, withLocalePrefix } from "@/i18n/LocaleProvider";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/";
  const { t, locale } = useLocale();

  const barePath = pathname === "/es" ? "/" : pathname.replace(/^\/es(?=\/|$)/, "") || "/";

  const navLinks = [
    { href: "/apply", label: "Michigan" },
    { href: "/pennsylvania", label: "Pennsylvania" },
    { href: "/faq", label: t("nav.faq") },
    { href: "/about", label: t("nav.about") },
    { href: "/contact", label: t("nav.contact") },
  ];

  function hrefFor(path: string) {
    return withLocalePrefix(path, locale);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-ink-200/80 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href={hrefFor("/")}
          aria-label={t("nav.homeAria")}
          className="flex items-center"
          onClick={() => setOpen(false)}
        >
          <Logo theme="color" className="h-8" />
        </Link>

        <nav aria-label={t("nav.primary")} className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={hrefFor(link.href)}
              className={`text-sm font-medium ${
                barePath === link.href ? "text-copper" : "text-ink/70 hover:text-ink"
              }`}
              aria-current={barePath === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={SUPPORT_MAILTO}
            className="hidden text-sm font-medium text-ink/70 hover:text-ink lg:inline"
          >
            {SUPPORT_EMAIL}
          </a>
          <LanguageToggle tone="light" className="hidden sm:inline-flex" />
          <Link href={hrefFor("/apply")} className={`${buttonClasses("primary", "md")} hidden sm:inline-flex`}>
            Get licensed
          </Link>
          <button
            type="button"
            className="inline-flex items-center justify-center p-2 text-ink lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            className="overflow-hidden border-t border-ink-200 px-4 lg:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <nav className="flex flex-col gap-1 py-3" aria-label={t("nav.primary")}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={hrefFor(link.href)}
                  className="py-2 text-sm font-medium text-ink"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <a href={SUPPORT_MAILTO} className="py-2 text-sm font-medium text-ink" onClick={() => setOpen(false)}>
                {SUPPORT_EMAIL}
              </a>
              <Link
                href={hrefFor("/apply")}
                className={`${buttonClasses("primary", "md")} mt-2`}
                onClick={() => setOpen(false)}
              >
                Get licensed
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
