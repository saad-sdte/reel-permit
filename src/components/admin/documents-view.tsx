"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import type { ApplicantDocument } from "@/lib/applicant-documents";
import type { ApplicationStatus } from "@/lib/storage";
import { CopyableValue } from "@/components/admin/copyable-value";
import { DocumentsGallery } from "@/components/admin/documents-gallery";
import { StatusPill } from "@/components/admin/status-pill";
import { STATES, customerName, stateLabel } from "@/components/admin/admin-utils";

type DocumentRow = {
  id: string;
  reference: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  stateSlug: string;
  status: ApplicationStatus;
  submittedAt: string;
  documents: ApplicantDocument[];
};

export function DocumentsView() {
  const [items, setItems] = useState<DocumentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [state, setState] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setAppliedQ(q), 300);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [appliedQ, state]);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setLoadError("");
      const sp = new URLSearchParams({
        view: "documents",
        page: String(page),
        pageSize: "25",
        sort: "newest",
      });
      if (appliedQ.trim()) sp.set("q", appliedQ.trim());
      if (state) sp.set("state", state);
      try {
        const res = await fetch(`/api/admin/data?${sp}`, { signal });
        const data = await res.json();
        if (signal?.aborted) return;
        if (!data.ok) {
          setLoadError(data.error || "Failed to load documents");
          return;
        }
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotal(typeof data.total === "number" ? data.total : 0);
      } catch (err) {
        if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) return;
        setLoadError("Could not load documents. Try refresh.");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [appliedQ, page, state],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    void load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const pages = Math.max(1, Math.ceil(total / 25));

  return (
    <div>
      <div className="admin-page-head admin-rise">
        <div>
          <h1 className="admin-title">Documents</h1>
          <p className="admin-sub">
            {total === 0
              ? "Scanned IDs and driver’s licenses uploaded by customers"
              : `${total} application${total === 1 ? "" : "s"} with scanned documents`}
          </p>
        </div>
        <button
          type="button"
          className="admin-btn-icon"
          onClick={() => void load()}
          disabled={loading}
          aria-label="Refresh documents"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? "admin-spin" : undefined} />
        </button>
      </div>

      {loadError ? <p className="admin-alert admin-alert-error">{loadError}</p> : null}

      <div className="admin-card admin-rise admin-rise-1" style={{ padding: "1rem 1.1rem" }}>
        <div className="admin-filters">
          <label>
            <div className="admin-field-label">Search</div>
            <div style={{ position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: 10, top: 11, opacity: 0.4 }} />
              <input
                className="admin-input"
                style={{ paddingLeft: 32 }}
                placeholder="Reference, email, name"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </label>
          <label>
            <div className="admin-field-label">State</div>
            <select
              className="admin-select"
              value={state}
              onChange={(e) => setState(e.target.value)}
            >
              <option value="">All</option>
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {stateLabel(s)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div style={{ display: "grid", gap: "0.85rem", marginTop: "0.85rem" }}>
        {loading && items.length === 0 ? (
          <p className="admin-muted">Loading documents…</p>
        ) : items.length === 0 ? (
          <div className="admin-card" style={{ padding: "1.25rem" }}>
            <p className="admin-muted" style={{ margin: 0 }}>
              No scanned documents yet. Once a customer uploads a driver’s license on any state
              application, it will appear here.
            </p>
          </div>
        ) : (
          items.map((row) => (
            <article key={row.id} className="admin-card admin-rise" style={{ padding: "1.1rem" }}>
              <div className="admin-meta-row" style={{ marginBottom: 12 }}>
                <Link
                  href={`/admin/applications/${row.id}?tab=documents`}
                  prefetch={false}
                  className="admin-link"
                  style={{ fontWeight: 700 }}
                >
                  {row.reference}
                </Link>
                <span className="admin-dot-sep">·</span>
                <CopyableValue
                  value={customerName(row.firstName, row.lastName)}
                  strong={false}
                />
                <span className="admin-dot-sep">·</span>
                <span>{stateLabel(row.stateSlug)}</span>
                <span className="admin-dot-sep">·</span>
                <StatusPill status={row.status} />
                <span className="admin-muted" style={{ marginLeft: "auto", fontSize: 12 }}>
                  {new Date(row.submittedAt).toLocaleString()} · {row.documents.length} file
                  {row.documents.length === 1 ? "" : "s"}
                </span>
              </div>
              <DocumentsGallery documents={row.documents} />
            </article>
          ))
        )}
      </div>

      {pages > 1 ? (
        <div className="admin-pagination" style={{ marginTop: "0.85rem" }}>
          <button
            type="button"
            className="admin-page-btn"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="admin-muted">
            Page {page} of {pages}
          </span>
          <button
            type="button"
            className="admin-page-btn"
            disabled={page >= pages || loading}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
