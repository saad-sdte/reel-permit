"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { SUPPORT_EMAIL } from "@/lib/contact";

/**
 * Contact form — submits to /api/contact, which emails the support team and
 * sends the customer an acknowledgement. Includes a honeypot field ("company")
 * that stays hidden from humans; bots that fill it are silently dropped.
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in your name, email, and message.");
      return;
    }
    setError(null);
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          reference: reference.trim() || undefined,
          message: message.trim(),
          company,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        errors?: Record<string, string[]>;
      };
      if (res.ok && json.ok) {
        setStatus("sent");
        return;
      }
      const firstFieldError = json.errors
        ? Object.values(json.errors)[0]?.[0]
        : undefined;
      setError(
        firstFieldError ??
          json.message ??
          `We couldn't send your message. Please try again, or email ${SUPPORT_EMAIL}.`,
      );
      setStatus("idle");
    } catch {
      setError(
        `We couldn't reach the server. Check your connection and try again, or email ${SUPPORT_EMAIL}.`,
      );
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <Card className="lg:col-span-3">
        <div className="px-6 py-12 text-center sm:px-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest-50">
            <CheckCircle2 className="h-8 w-8 text-forest-600" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-navy">Message sent</h2>
          <p className="mx-auto mt-2 max-w-md text-slate-600">
            Thanks{name.trim() ? `, ${name.trim().split(/\s+/)[0]}` : ""} — your message is
            on its way to the team. We typically reply within 1 business day, and a
            confirmation has been emailed to{" "}
            <span className="font-semibold text-navy">{email.trim()}</span>.
          </p>
          <Button
            variant="outline"
            className="mt-8"
            onClick={() => {
              setMessage("");
              setReference("");
              setStatus("idle");
            }}
          >
            Send another message
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-3">
      <form onSubmit={handleSubmit} noValidate className="space-y-5 px-6 py-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Your name"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Input
          label="Application reference (optional)"
          name="reference"
          placeholder="RP-…"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          helpText="Found on your confirmation screen and in your confirmation email."
        />
        <Textarea
          label="Message"
          name="message"
          rows={6}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        {/* Honeypot — hidden from humans, tempting to bots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
          <label>
            Company
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </label>
        </div>
        {error && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {error}
          </p>
        )}
        <Button type="submit" variant="accent" disabled={status === "sending"}>
          <Send className="h-4 w-4" aria-hidden="true" />
          {status === "sending" ? "Sending…" : "Send message"}
        </Button>
        <p className="text-xs leading-relaxed text-slate-500">
          We&rsquo;ll reply to the email address you enter above. Please don&rsquo;t include
          full Social Security numbers or card details in your message.
        </p>
      </form>
    </Card>
  );
}
