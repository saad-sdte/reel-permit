"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, KeyRound, LogOut, UserRound } from "lucide-react";
import type { PublicAdminUser } from "@/lib/admin-users";
import { AdminAvatar } from "@/components/admin/admin-avatar";

export function firstNameOf(user: PublicAdminUser | null) {
  const name = user?.name?.trim();
  if (name) return name.split(/\s+/)[0];
  const email = user?.email?.trim() || "";
  return email.split("@")[0] || "there";
}

export function initialsOf(user: PublicAdminUser | null) {
  const name = user?.name?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "AP";
  }
  return (user?.email?.[0] || "A").toUpperCase();
}

export function AdminAccountMenu({
  me,
  onLogout,
  onMeChange,
}: {
  me: PublicAdminUser | null;
  onLogout: () => void;
  onMeChange: (user: PublicAdminUser) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<"profile" | "password" | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="admin-account" ref={wrapRef}>
      <button
        type="button"
        className="admin-account-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <AdminAvatar />
        <span className="admin-account-meta">
          <strong>{me?.name || "Admin"}</strong>
          <span>{me?.role === "admin" ? "Admin" : "Team"}</span>
        </span>
        <ChevronDown size={16} />
      </button>
      {open ? (
        <div className="admin-account-menu" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setDialog("profile");
            }}
          >
            <UserRound size={15} /> Edit profile
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setDialog("password");
            }}
          >
            <KeyRound size={15} /> Change password
          </button>
          <button type="button" role="menuitem" onClick={onLogout}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      ) : null}
      {dialog === "profile" ? (
        <ProfileDialog
          me={me}
          onClose={() => setDialog(null)}
          onSaved={onMeChange}
        />
      ) : null}
      {dialog === "password" ? (
        <PasswordDialog onClose={() => setDialog(null)} />
      ) : null}
    </div>
  );
}

function ProfileDialog({
  me,
  onClose,
  onSaved,
}: {
  me: PublicAdminUser | null;
  onClose: () => void;
  onSaved: (user: PublicAdminUser) => void;
}) {
  const [name, setName] = useState(me?.name ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Could not save profile.");
        return;
      }
      onSaved(data.me);
      onClose();
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form
        className="admin-modal"
        style={{ textAlign: "left" }}
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <h2 className="admin-modal-title">Edit profile</h2>
        <label style={{ display: "block", marginTop: 16 }}>
          <div className="admin-field-label">Display name</div>
          <input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
        </label>
        <p className="admin-muted" style={{ marginTop: 8, fontSize: 13 }}>
          {me?.email}
        </p>
        {error ? <p className="admin-alert admin-alert-error">{error}</p> : null}
        <div className="admin-modal-actions">
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PasswordDialog({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (newPassword !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Could not change password.");
        return;
      }
      onClose();
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form
        className="admin-modal"
        style={{ textAlign: "left" }}
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <h2 className="admin-modal-title">Change password</h2>
        <label style={{ display: "block", marginTop: 16 }}>
          <div className="admin-field-label">Current password</div>
          <input className="admin-input" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} required />
        </label>
        <label style={{ display: "block", marginTop: 12 }}>
          <div className="admin-field-label">New password</div>
          <input className="admin-input" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNext(e.target.value)} required minLength={8} />
        </label>
        <label style={{ display: "block", marginTop: 12 }}>
          <div className="admin-field-label">Confirm new password</div>
          <input className="admin-input" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
        </label>
        {error ? <p className="admin-alert admin-alert-error">{error}</p> : null}
        <div className="admin-modal-actions">
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Update password"}
          </button>
        </div>
      </form>
    </div>
  );
}
