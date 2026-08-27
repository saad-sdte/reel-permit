"use client";

import { STATUS_BG, STATUS_COLOR, labelStatus } from "@/components/admin/admin-utils";

export function StatusPill({ status }: { status: string }) {
  const color = STATUS_COLOR[status] || "#64748b";
  const bg = STATUS_BG[status] || "rgba(100, 116, 139, 0.14)";
  return (
    <span className="admin-pill" style={{ color, background: bg }}>
      {labelStatus(status)}
    </span>
  );
}
