"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, FileUp, Loader2, Send, X } from "lucide-react";
import type { ApplicationRecord } from "@/lib/storage";
import { CopyableValue } from "@/components/admin/copyable-value";

const STATE_NAMES = [
  "California",
  "Colorado",
  "Florida",
  "Michigan",
  "North Carolina",
  "South Carolina",
  "Texas",
  "Pennsylvania",
];

const STATE_LABEL: Record<string, string> = {
  california: "California",
  colorado: "Colorado",
  florida: "Florida",
  michigan: "Michigan",
  "north-carolina": "North Carolina",
  "south-carolina": "South Carolina",
  texas: "Texas",
  pennsylvania: "Pennsylvania",
};

const ACCEPT = "application/pdf,image/png,image/jpeg";
const MAX_FILES = 5;
const MAX_TOTAL = 15 * 1024 * 1024;

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function DeliverView() {
  const searchParams = useSearchParams();
  const [to, setTo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [reference, setReference] = useState("");
  const [stateName, setStateName] = useState("");
  const [note, setNote] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [force, setForce] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [lookupMsg, setLookupMsg] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  const totalBytes = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);

  const addFiles = useCallback((list: FileList | File[]) => {
    setError(null);
    const incoming = Array.from(list).filter((f) => ACCEPT.split(",").includes(f.type));
    if (!incoming.length) {
      setError("Only PDF, PNG, or JPG files are allowed.");
      return;
    }
    setFiles((prev) => {
      const next = [...prev, ...incoming].slice(0, MAX_FILES);
      const bytes = next.reduce((s, f) => s + f.size, 0);
      if (bytes > MAX_TOTAL) {
        setError("Attachments exceed the 15 MB combined limit.");
        return prev;
      }
      return next;
    });
  }, []);

  const lookupReference = useCallback(async (refOverride?: string) => {
    const ref = (refOverride ?? reference).trim();
    if (ref.length < 4) return;
    setLookingUp(true);
    setLookupMsg("");
    try {
      const res = await fetch(
        `/api/admin/data?view=byRef&reference=${encodeURIComponent(ref)}`,
      );
      const data = await res.json();
      if (!data.ok || !data.app) {
        setLookupMsg("No application found for that reference — fill fields manually.");
        return;
      }
      const app = data.app as ApplicationRecord;
      const summary = data.licenseSummary as
        | { startDate: string | null; endDate: string | null; formatted: string | null }
        | null;
      setReference(app.reference);
      setTo(app.email || "");
      setCustomerName([app.firstName, app.lastName].filter(Boolean).join(" ") || "");
      setStateName(STATE_LABEL[app.stateSlug] || app.stateSlug);
      // Auto-prefill validity dates from the applicant's chosen start date +
      // the SKU's duration. Only overwrites blank fields so a partly-filled
      // form isn't clobbered when re-looking up a reference.
      if (summary?.startDate) {
        setValidFrom((v) => (v ? v : summary.startDate ?? ""));
      }
      if (summary?.endDate) {
        setValidTo((v) => (v ? v : summary.endDate ?? ""));
      }
      const validSuffix = summary?.formatted ? ` · Valid ${summary.formatted}` : "";
      setLookupMsg(
        `Loaded ${app.reference} · ${app.status} · $${(app.amountCents / 100).toFixed(2)}${validSuffix}`,
      );
    } catch {
      setLookupMsg("Lookup failed — fill fields manually.");
    } finally {
      setLookingUp(false);
    }
  }, [reference]);

  useEffect(() => {
    const q = searchParams.get("reference")?.trim();
    if (!q || prefilled) return;
    setReference(q);
    setPrefilled(true);
    void lookupReference(q);
  }, [searchParams, prefilled, lookupReference]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!files.length) {
      setError("Attach the issued license (PDF, PNG, or JPG).");
      return;
    }
    setStatus("sending");
    const form = new FormData();
    form.set("to", to.trim());
    form.set("customerName", customerName.trim());
    form.set("reference", reference.trim());
    form.set("stateName", stateName.trim());
    form.set("note", note.trim());
    form.set("licenseNumber", licenseNumber.trim());
    form.set("validFrom", validFrom.trim());
    form.set("validTo", validTo.trim());
    if (force) form.set("force", "true");
    for (const file of files) form.append("files", file);

    try {
      const res = await fetch("/api/admin/deliver-license", {
        method: "POST",
        body: form,
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (res.ok && json.ok) {
        setStatus("sent");
        return;
      }
      setError(json.message ?? "Send failed — check the fields and try again.");
      setStatus("idle");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div className="admin-card admin-rise" style={{ padding: "2.5rem 1.5rem", textAlign: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            margin: "0 auto",
            borderRadius: 999,
            background: "#ecfdf5",
            color: "#15803d",
            display: "grid",
            placeItems: "center",
          }}
        >
          <CheckCircle2 size={28} />
        </div>
        <h2 style={{ margin: "1rem 0 0", fontSize: "1.35rem" }}>License delivered</h2>
        <p className="admin-sub" style={{ marginTop: 8 }}>
          Sent to <CopyableValue value={to.trim()} />. License files were emailed as attachments
          and are not retained in storage.
        </p>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          style={{ marginTop: 20 }}
          onClick={() => {
            setFiles([]);
            setNote("");
            setLicenseNumber("");
            setValidFrom("");
            setValidTo("");
            setForce(false);
            setStatus("idle");
            setError(null);
          }}
        >
          Deliver another
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-head admin-rise">
        <div>
          <h1 className="admin-title">Deliver license</h1>
          <p className="admin-sub">
            Upload the issued license, email it to the customer, and mark the order delivered.
            Files are emailed as attachments only — not retained in storage.
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="admin-card admin-rise admin-rise-1"
        style={{ padding: "1.35rem", marginTop: "1.2rem", display: "grid", gap: 14 }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 10,
            alignItems: "end",
          }}
        >
          <label>
            <div style={{ fontSize: 11, marginBottom: 4, color: "var(--ap-muted)" }}>
              Reference *
            </div>
            <input
              className="admin-input"
              required
              placeholder="RP-MICHIGAN-…"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              onBlur={() => void lookupReference()}
            />
          </label>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => void lookupReference()}
            disabled={lookingUp || reference.trim().length < 4}
            style={{ height: 42 }}
          >
            {lookingUp ? <Loader2 size={16} className="admin-spin" /> : "Load order"}
          </button>
        </div>
        {lookupMsg ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--ap-sea)" }}>{lookupMsg}</p>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
          }}
        >
          <label>
            <div style={{ fontSize: 11, marginBottom: 4, color: "var(--ap-muted)" }}>
              Customer email *
            </div>
            <input
              className="admin-input"
              type="email"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <label>
            <div style={{ fontSize: 11, marginBottom: 4, color: "var(--ap-muted)" }}>
              Customer name *
            </div>
            <input
              className="admin-input"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </label>
          <label>
            <div style={{ fontSize: 11, marginBottom: 4, color: "var(--ap-muted)" }}>State *</div>
            <input
              className="admin-input"
              list="deliver-states"
              required
              placeholder="Texas"
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
            />
            <datalist id="deliver-states">
              {STATE_NAMES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10,
          }}
        >
          <label>
            <div style={{ fontSize: 11, marginBottom: 4, color: "var(--ap-muted)" }}>
              License number
            </div>
            <input
              className="admin-input"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="Optional"
            />
          </label>
          <label>
            <div style={{ fontSize: 11, marginBottom: 4, color: "var(--ap-muted)" }}>
              Valid from
            </div>
            <input
              className="admin-input"
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
            />
          </label>
          <label>
            <div style={{ fontSize: 11, marginBottom: 4, color: "var(--ap-muted)" }}>Valid to</div>
            <input
              className="admin-input"
              type="date"
              value={validTo}
              onChange={(e) => setValidTo(e.target.value)}
            />
          </label>
        </div>

        <label>
          <div style={{ fontSize: 11, marginBottom: 4, color: "var(--ap-muted)" }}>
            Personal note (optional)
          </div>
          <textarea
            className="admin-input"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Shown in a highlighted box in the customer email"
            style={{ resize: "vertical", minHeight: 84 }}
          />
        </label>

        <div>
          <div style={{ fontSize: 11, marginBottom: 6, color: "var(--ap-muted)" }}>
            License file(s) *
          </div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
            }}
            style={{
              border: `1.5px dashed ${dragOver ? "var(--ap-sea)" : "var(--ap-line)"}`,
              borderRadius: 14,
              padding: "1.35rem 1rem",
              background: dragOver ? "rgba(43,181,154,0.08)" : "rgba(255,255,255,0.65)",
              textAlign: "center",
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            <FileUp size={22} style={{ color: "var(--ap-sea)", marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: 14, fontWeight: 650 }}>
              Drop PDF / PNG / JPG here, or{" "}
              <label
                style={{ color: "var(--ap-sea)", cursor: "pointer", textDecoration: "underline" }}
              >
                browse
                <input
                  type="file"
                  multiple
                  accept={ACCEPT}
                  hidden
                  onChange={(e) => {
                    if (e.target.files?.length) addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--ap-muted)" }}>
              Up to {MAX_FILES} files · 15 MB combined · emailed as attachments only
            </p>
          </div>

          {files.length > 0 ? (
            <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "grid", gap: 8 }}>
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: "#fff",
                    border: "1px solid var(--ap-line)",
                    fontSize: 13,
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <strong>{f.name}</strong>
                    <span style={{ color: "var(--ap-muted)", marginLeft: 8 }}>
                      {formatBytes(f.size)}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="admin-btn-icon"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    style={{ width: 34, height: 34, color: "#b91c1c" }}
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
              <li style={{ fontSize: 12, color: "var(--ap-muted)" }}>
                Total {formatBytes(totalBytes)}
              </li>
            </ul>
          ) : null}
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={force}
            onChange={(e) => setForce(e.target.checked)}
          />
          Force resend if a delivery email was already sent for this reference
        </label>

        {error ? (
          <p role="alert" style={{ margin: 0, fontSize: 13, color: "#b91c1c", fontWeight: 600 }}>
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="admin-btn admin-btn-primary"
          disabled={status === "sending"}
          style={{ width: "fit-content", display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          {status === "sending" ? (
            <Loader2 size={16} className="admin-spin" />
          ) : (
            <Send size={16} />
          )}
          {status === "sending" ? "Sending…" : "Send license email"}
        </button>
      </form>
    </div>
  );
}
