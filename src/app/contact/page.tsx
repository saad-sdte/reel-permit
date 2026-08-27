import type { Metadata } from "next";
import Link from "next/link";
import { InnerPage } from "@/components/InnerPage";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Write ReelPermit about a Michigan application. Reference numbers start with RP-.",
};

export default function ContactPage() {
  return (
    <InnerPage kicker="Contact" title="Contact ReelPermit">
      <p className="mb-8 text-lg">
        Include your <span className="font-mono font-semibold text-copper">RP-</span> reference if you
        already applied. Never send a full SSN or card number by email.
      </p>
      <div className="cl-apply">
        <ContactForm />
      </div>
      <p className="mt-8 text-sm text-ink/60">
        Or{" "}
        <a href="mailto:support@reelpermit.local" className="font-semibold text-copper underline">
          support@reelpermit.local
        </a>
        .{" "}
        <Link href="/faq" className="underline">
          FAQ
        </Link>
        .
      </p>
    </InnerPage>
  );
}
