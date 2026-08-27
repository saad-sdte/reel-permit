"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { buttonClasses } from "@/components/ui/Button";
import { Magnetic } from "@/components/motion/Magnetic";

const ease = [0.22, 1, 0.36, 1] as const;

export function HeroSection({ dayPrice, annualPrice }: { dayPrice: string; annualPrice: string }) {
  const reduce = useReducedMotion();

  const parent = {
    hidden: {},
    show: {
      transition: reduce ? { staggerChildren: 0 } : { staggerChildren: 0.09, delayChildren: 0.08 },
    },
  };

  const child = {
    hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.65, ease },
    },
  };

  return (
    <section className="relative isolate min-h-[34rem] overflow-hidden text-white sm:min-h-[40rem]">
      <motion.div
        className="absolute inset-0"
        initial={reduce ? false : { scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: reduce ? 0 : 7.5, ease: "easeOut" }}
      >
        <Image
          src="/images/hero.jpg"
          alt="Still water at first light"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-navy-950/90 via-navy-900/70 to-navy-900/30" />
      <motion.div
        className="relative mx-auto flex min-h-[34rem] max-w-6xl flex-col justify-end px-4 py-16 sm:min-h-[40rem] sm:px-6 lg:justify-center"
        variants={parent}
        initial="hidden"
        animate="show"
      >
        <motion.p variants={child} className="text-sm font-semibold tracking-wide text-gold-300">
          Michigan · fishing licenses
        </motion.p>
        <motion.h1
          variants={child}
          className="mt-3 max-w-3xl font-display text-4xl leading-tight text-white sm:text-6xl"
        >
          Skip the MDNR maze. Get the real license.
        </motion.h1>
        <motion.p variants={child} className="mt-5 max-w-xl text-lg leading-relaxed text-white/85">
          Fill one form. We buy it on the official eLicense portal. Michigan emails you nothing —
          we send you the state-issued document.
        </motion.p>
        <motion.div variants={child} className="mt-8 flex flex-wrap items-center gap-3">
          <Magnetic>
            <Link href="/apply" className={buttonClasses("primary", "lg")}>
              Start application
            </Link>
          </Magnetic>
          <Magnetic>
            <a href="#licenses" className={buttonClasses("inverse", "lg")}>
              See prices
            </a>
          </Magnetic>
        </motion.div>
        <motion.p variants={child} className="mt-6 text-sm text-white/70">
          1-day from {dayPrice} · Resident annual {annualPrice} · One total at checkout
        </motion.p>
      </motion.div>
    </section>
  );
}
