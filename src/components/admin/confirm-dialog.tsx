"use client";

import { Archive, AlertTriangle } from "lucide-react";

export function ConfirmDialog(props: {
  open: boolean;
  title: string;
  body: string;
  error?: string;
  confirmLabel?: string;
  busy?: boolean;
  variant?: "danger" | "warning";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!props.open) return null;
  const warning = props.variant === "warning";
  return (
    <div
      className="admin-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !props.busy) props.onCancel();
      }}
    >
      <div
        className="admin-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        aria-describedby="admin-confirm-desc"
      >
        <div
          className="admin-modal-icon"
          aria-hidden
          style={
            warning
              ? { background: "#fff7ed", color: "#c2410c", borderColor: "#fed7aa" }
              : undefined
          }
        >
          {warning ? <Archive size={22} /> : <AlertTriangle size={22} />}
        </div>
        <h2 id="admin-confirm-title" className="admin-modal-title">
          {props.title}
        </h2>
        <p id="admin-confirm-desc" className="admin-modal-body">
          {props.body}
        </p>
        {props.error ? (
          <p className="admin-modal-body" style={{ color: "#b91c1c", marginTop: 8 }} role="alert">
            {props.error}
          </p>
        ) : null}
        <div className="admin-modal-actions">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={props.onCancel}
            disabled={props.busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className={warning ? "admin-btn admin-btn-primary" : "admin-btn admin-btn-danger"}
            onClick={props.onConfirm}
            disabled={props.busy}
          >
            {props.busy ? "Working…" : props.confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
