import type { Metadata } from "next";
import Link from "next/link";
import { FAQ_ITEMS } from "@/data/faq";
import { InnerPage } from "@/components/InnerPage";
import { buttonClasses } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about ReelPermit, pricing, and Michigan and Pennsylvania licenses.",
};

export default function FaqPage() {
  return (
    <InnerPage kicker="FAQ" title="Frequently asked questions">
      <div className="space-y-2">
        {FAQ_ITEMS.map((item) => (
          <details key={item.question} className="border-b border-ink-200 py-4">
            <summary className="cursor-pointer font-sans text-lg font-bold text-navy">{item.question}</summary>
            <p className="mt-3">{item.answer}</p>
          </details>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/apply" className={buttonClasses("primary", "lg")}>
          Michigan application
        </Link>
        <Link href="/pennsylvania" className={buttonClasses("outline", "lg")}>
          Pennsylvania application
        </Link>
      </div>
    </InnerPage>
  );
}
