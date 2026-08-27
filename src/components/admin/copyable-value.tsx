"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through — insecure context / permission denied */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.width = "1px";
    ta.style.height = "1px";
    ta.style.padding = "0";
    ta.style.border = "none";
    ta.style.outline = "none";
    ta.style.boxShadow = "none";
    ta.style.background = "transparent";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function toCopyText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

type Props = {
  value: unknown;
  /** Visible label when value is empty */
  empty?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Stronger weight for primary values */
  strong?: boolean;
  /**
   * When set, click navigates instead of copying (used for application reference → detail).
   */
  href?: string;
};

/**
 * Click any admin text value to copy it — no icon, click the text itself.
 * Pass `href` to open a page instead (reference → application detail).
 */
export function CopyableValue({
  value,
  empty = "—",
  className,
  style,
  strong = true,
  href,
}: Props) {
  const text = toCopyText(value);
  const emptyValue = !text.trim() || text === "—";
  const [feedback, setFeedback] = useState<"copied" | "failed" | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const onCopy = useCallback(async () => {
    if (emptyValue) return;
    const ok = await writeClipboard(text);
    setFeedback(ok ? "copied" : "failed");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setFeedback(null), 1400);
  }, [emptyValue, text]);

  if (emptyValue) {
    return (
      <span className={className} style={{ color: "var(--ap-muted)", ...style }}>
        {empty}
      </span>
    );
  }

  const sharedClass = `admin-copyable${feedback === "copied" ? " is-copied" : ""}${
    feedback === "failed" ? " is-failed" : ""
  }${className ? ` ${className}` : ""}`;
  const sharedStyle: React.CSSProperties = { fontWeight: strong ? 650 : 500, ...style };

  if (href) {
    return (
      <Link
        href={href}
        className={`${sharedClass} admin-copyable-link`}
        title="Open application"
        aria-label={`Open ${text}`}
        style={sharedStyle}
      >
        <span className="admin-copyable-text">{text}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={sharedClass}
      onClick={() => void onCopy()}
      title={
        feedback === "copied" ? "Copied" : feedback === "failed" ? "Copy failed" : "Click to copy"
      }
      aria-label={
        feedback === "copied" ? "Copied" : feedback === "failed" ? "Copy failed" : `Copy ${text}`
      }
      style={sharedStyle}
    >
      <span className="admin-copyable-text">{text}</span>
      {feedback === "copied" ? <span className="admin-copyable-toast">Copied</span> : null}
      {feedback === "failed" ? <span className="admin-copyable-toast">Copy failed</span> : null}
    </button>
  );
}
