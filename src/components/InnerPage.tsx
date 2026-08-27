import type { ReactNode } from "react";

export function InnerPage({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="bg-cream pb-16">
      <header className="border-b border-ink-200 bg-white px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl" data-aos="fade-up">
          <p className="text-sm font-semibold tracking-wide text-copper">{kicker}</p>
          <h1 className="mt-2 font-display text-4xl text-navy sm:text-5xl">{title}</h1>
        </div>
      </header>
      <div className="inner-prose mx-auto max-w-3xl px-4 py-10 sm:px-6" data-aos="fade-up" data-aos-delay="80">
        {children}
      </div>
    </article>
  );
}
