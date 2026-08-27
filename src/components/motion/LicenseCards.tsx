"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { formatPrice } from "@/lib/format";

export function LicenseCards({
  items,
}: {
  items: { id: string; name: string; who: string; price: number }[];
}) {
  const reduce = useReducedMotion();

  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2">
      {items.map((row, i) => (
        <motion.div
          key={row.id}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.5, delay: reduce ? 0 : i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          whileHover={reduce ? undefined : { y: -6 }}
        >
          <Link
            href="/apply"
            className="group flex items-start justify-between gap-4 rounded-lg border border-ink-200 bg-white p-5 shadow-card transition-colors hover:border-copper"
          >
            <div>
              <h3 className="font-sans text-lg font-semibold text-navy group-hover:text-copper">
                {row.name}
              </h3>
              <p className="mt-1 text-sm text-ink/60">{row.who}</p>
            </div>
            <p className="shrink-0 font-display text-2xl text-navy">{formatPrice(row.price)}</p>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
