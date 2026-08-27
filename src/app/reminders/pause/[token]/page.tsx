import type { Metadata } from "next";
import Link from "next/link";
import { BellOff, CheckCircle2 } from "lucide-react";
import { checkRetryToken } from "@/lib/retry-tokens";
import { getApplicationById } from "@/lib/storage";
import { Card } from "@/components/ui/Card";
import { Button, buttonClasses } from "@/components/ui/Button";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pause payment reminders",
  robots: { index: false, follow: false },
};

/**
 * /reminders/pause/{token} — no-login confirmation page for pausing the
 * payment-reminder sequence (linked from emails #5–#7; the List-Unsubscribe
 * header POSTs straight to the API instead).
 */
export default async function PauseRemindersPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { done?: string };
}) {
  const check = await checkRetryToken(params.token);
  const app =
    check.status === "valid" || check.status === "expired" || check.status === "used"
      ? await getApplicationById(check.applicationId)
      : null;

  const alreadyPaused = Boolean(searchParams.done) ||
    (app ? app.status !== "payment_failed" && check.status === "used" : false);

  const content =
    check.status === "invalid" || !app ? (
      <>
        <h1 className="mt-5 text-2xl font-bold text-navy">This link isn&rsquo;t valid</h1>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-slate-600">
          We couldn&rsquo;t find a matching application. If you&rsquo;re still receiving emails
          you don&rsquo;t want, contact us and we&rsquo;ll take care of it right away.
        </p>
        <Link href="/contact" className={`${buttonClasses("outline")} mt-8`}>
          Contact support
        </Link>
      </>
    ) : alreadyPaused ? (
      <>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest-50">
          <CheckCircle2 className="h-8 w-8 text-forest-600" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-navy">Reminders paused</h1>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-slate-600">
          You won&rsquo;t receive any more payment reminders for application{" "}
          <span className="font-mono font-semibold text-navy">{app.reference}</span>. If payment
          isn&rsquo;t completed, the application simply expires as previously communicated —
          nothing is ever charged.
        </p>
        <p className="mt-4 text-sm text-slate-500">
          Changed your mind? You can still complete payment from the link in any of our earlier
          emails until the application expires.
        </p>
      </>
    ) : (
      <>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <BellOff className="h-8 w-8 text-slate-500" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-navy">Pause payment reminders?</h1>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-slate-600">
          We&rsquo;ll stop sending payment reminders for application{" "}
          <span className="font-mono font-semibold text-navy">{app.reference}</span>. Your
          application stays saved until its expiry date, and you were not charged anything.
        </p>
        <form method="POST" action={`/api/dunning/pause?token=${encodeURIComponent(params.token)}`} className="mt-8">
          <Button type="submit" variant="accent">
            Pause reminders
          </Button>
        </form>
        <p className="mt-4 text-xs text-slate-500">
          This only stops reminder emails — receipts and essential notices are unaffected.
        </p>
      </>
    );

  return (
    <section className="py-16 sm:py-20">
      <div className="container-site max-w-2xl">
        <Card>
          <div className="px-6 py-12 text-center sm:px-10">{content}</div>
        </Card>
      </div>
    </section>
  );
}
