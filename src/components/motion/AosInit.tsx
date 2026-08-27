"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import AOS from "aos";
import "aos/dist/aos.css";

export function AosInit() {
  const pathname = usePathname();

  useEffect(() => {
    AOS.init({
      once: true,
      duration: 700,
      easing: "ease-out-cubic",
      offset: 80,
      delay: 0,
      disable: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
    document.documentElement.classList.add("aos-on");
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => AOS.refreshHard(), 40);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}
