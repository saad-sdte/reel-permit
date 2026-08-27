"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

export interface LogoProps {
  variant?: "full" | "mark";
  theme?: "color" | "white";
  className?: string;
  priority?: boolean;
}

export function Logo({ className = "h-9", theme = "color" }: LogoProps) {
  const reduce = useReducedMotion();
  const name = theme === "white" ? "text-white" : "text-navy";
  const stroke = theme === "white" ? "stroke-white" : "stroke-copper";
  const fill = theme === "white" ? "fill-white" : "fill-copper";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
        <motion.circle
          className={stroke}
          cx="13.5"
          cy="16"
          r="8.2"
          fill="none"
          strokeWidth="2.1"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.circle
          className={`${stroke} ${theme === "white" ? "fill-transparent" : "fill-transparent"}`}
          cx="13.5"
          cy="16"
          r="4.6"
          fill="none"
          strokeWidth="1.5"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.55, delay: reduce ? 0 : 0.15, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.circle
          className={fill}
          cx="13.5"
          cy="16"
          r="1.7"
          initial={reduce ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: reduce ? 0 : 0.35, type: "spring", stiffness: 380, damping: 18 }}
        />
        <motion.path
          className={stroke}
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          d="M21.2 12.4c3.2-1.6 6.2-.4 8.4 5.2"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, delay: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className={`font-display text-[1.25rem] font-semibold leading-none tracking-tight ${name}`}>
        ReelPermit
      </span>
    </span>
  );
}

export function LogoLink({
  className = "h-9",
  href = "/",
  theme = "color",
}: LogoProps & { href?: string }) {
  return (
    <Link href={href} aria-label="ReelPermit home" className="inline-flex items-center">
      <Logo className={className} theme={theme} />
    </Link>
  );
}
