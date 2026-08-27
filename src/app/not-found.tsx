import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="px-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-copper">Page not found</p>
      <h1 className="mt-3 font-display text-4xl text-navy">We could not find that page</h1>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className={buttonClasses("outline", "lg")}>
          Home
        </Link>
        <Link href="/apply" className={buttonClasses("primary", "lg")}>
          Start application
        </Link>
      </div>
    </section>
  );
}
