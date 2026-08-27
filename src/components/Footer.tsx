"use client";

import Link from "next/link";
import { NON_AFFILIATION_DISCLAIMER } from "@/components/ui/DisclaimerBanner";
import { Logo } from "@/components/Logo";
import { useLocale, withLocalePrefix } from "@/i18n/LocaleProvider";

export function Footer() {
  const { locale } = useLocale();

  function hrefFor(path: string) {
    return withLocalePrefix(path, locale);
  }

  const links = [
    { href: "/apply", label: "Apply" },
    { href: "/how-it-works", label: "How it works" },
    { href: "/official-sites", label: "Official MDNR portal" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/refund", label: "Refunds" },
    { href: "/disclaimer", label: "Disclaimer" },
  ];

  return (
    <footer data-site-footer className="bg-navy text-white">
      <div className="container-site py-12">
        <Logo theme="white" />
        <p className="mt-3 max-w-xl text-sm text-white/70">
          A private desk that files Michigan fishing licenses on the official MDNR portal.
          You get the state-issued document — we handle the paperwork.
        </p>
        <nav className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={hrefFor(link.href)} className="text-white/80 underline-offset-2 hover:text-white hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-white/50">{NON_AFFILIATION_DISCLAIMER}</p>
      </div>
    </footer>
  );
}
