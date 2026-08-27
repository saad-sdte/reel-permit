import { useId } from "react";

/** Placeholder portrait when an admin has no uploaded photo. */
export function AdminAvatar({ className }: { className?: string }) {
  const gid = useId().replace(/:/g, "");
  return (
    <span className={`admin-avatar${className ? ` ${className}` : ""}`} aria-hidden>
      <svg viewBox="0 0 64 64" width="32" height="32">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="32" fill={`url(#${gid})`} />
        <circle cx="32" cy="25" r="11" fill="#ecfdf8" />
        <path d="M12 58c3-14 12-20 20-20s17 6 20 20" fill="#ecfdf8" />
      </svg>
    </span>
  );
}
