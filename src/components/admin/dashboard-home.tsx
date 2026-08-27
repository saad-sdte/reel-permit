"use client";

import { useEffect, useMemo, useState, type DragEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  CircleDollarSign,
  Clock3,
  FileStack,
  FolderOpen,
  GripVertical,
  Images,
  ListChecks,
  MapPin,
  PieChart,
  Receipt,
  RefreshCw,
  Send,
} from "lucide-react";
import type { ApplicationRecord } from "@/lib/storage";
import type { ApplicantDocument } from "@/lib/applicant-documents";
import type { PublicAdminUser } from "@/lib/admin-users";
import { CopyableValue } from "@/components/admin/copyable-value";
import { StatusPill } from "@/components/admin/status-pill";
import {
  STATUS_COLOR,
  customerName,
  labelStatus,
  money,
  stateLabel,
} from "@/components/admin/admin-utils";
import { firstNameOf } from "@/components/admin/account-menu";

export type DashStats = {
  total: number;
  paidCount: number;
  revenueCents: number;
  byStatus: Record<string, number>;
  byState: Record<string, number>;
  last14: { date: string; cents: number; label: string }[];
  mongoError?: string | null;
};

export type DocRow = {
  id: string;
  reference: string;
  firstName: string | null;
  lastName: string | null;
  stateSlug: string;
  submittedAt: string;
  documents: ApplicantDocument[];
};

const ACTION_STATUSES = new Set(["received", "processing", "missing_info", "future_pending"]);
const BOARD_KEY = "ap_admin_dash_order_v1";
const DEFAULT_ORDER = ["states", "status", "queue", "scans", "fulfill", "paid"] as const;
type WidgetId = (typeof DEFAULT_ORDER)[number];
const COMPACT = new Set<WidgetId>(["states", "status", "queue"]);

function readOrder(): WidgetId[] {
  if (typeof window === "undefined") return [...DEFAULT_ORDER];
  try {
    const raw = window.localStorage.getItem(BOARD_KEY);
    if (!raw) return [...DEFAULT_ORDER];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_ORDER];
    const next = parsed.filter((id): id is WidgetId => DEFAULT_ORDER.includes(id as WidgetId));
    for (const id of DEFAULT_ORDER) if (!next.includes(id)) next.push(id);
    return next;
  } catch {
    return [...DEFAULT_ORDER];
  }
}

function WidgetCard({
  id,
  compact,
  children,
  onMove,
}: {
  id: WidgetId;
  compact?: boolean;
  children: ReactNode;
  onMove: (from: WidgetId, to: WidgetId) => void;
}) {
  const [over, setOver] = useState(false);

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    const from = e.dataTransfer.getData("text/plain") as WidgetId;
    if (from && from !== id) onMove(from, id);
  }

  return (
    <article
      className={`admin-card admin-widget${compact ? " admin-widget-compact" : ""}${over ? " is-drop" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    >
      <button
        type="button"
        className="admin-widget-grip"
        draggable
        aria-label="Drag to rearrange this card"
        title="Drag to rearrange"
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", id);
          e.dataTransfer.effectAllowed = "move";
        }}
      >
        <GripVertical size={14} />
      </button>
      {children}
    </article>
  );
}

export function DashboardHome({
  me,
  stats,
  orders,
  docs,
  queue,
  refreshing,
  onRefresh,
}: {
  me: PublicAdminUser | null;
  stats: DashStats;
  orders: ApplicationRecord[];
  docs: DocRow[];
  queue: ApplicationRecord[];
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const [order, setOrder] = useState<WidgetId[]>([...DEFAULT_ORDER]);

  useEffect(() => {
    setOrder(readOrder());
  }, []);

  function moveCard(from: WidgetId, to: WidgetId) {
    setOrder((prev) => {
      const next = prev.filter((id) => id !== from);
      const at = next.indexOf(to);
      next.splice(at < 0 ? next.length : at, 0, from);
      window.localStorage.setItem(BOARD_KEY, JSON.stringify(next));
      return next;
    });
  }

  const pendingCount =
    (stats.byStatus.pending_payment ?? 0) + (stats.byStatus.payment_failed ?? 0);
  const needsAttention =
    (stats.byStatus.received ?? 0) +
    (stats.byStatus.missing_info ?? 0) +
    (stats.byStatus.processing ?? 0);
  const statusEntries = Object.entries(stats.byStatus).sort((a, b) => b[1] - a[1]);
  const stateEntries = Object.entries(stats.byState).sort((a, b) => b[1] - a[1]);
  const donutTotal = statusEntries.reduce((s, [, n]) => s + n, 0) || 1;
  const actionQueue = queue.filter((a) => ACTION_STATUSES.has(a.status)).slice(0, 3);
  const maxState = Math.max(1, ...stateEntries.map(([, n]) => n));

  const arcs = useMemo(() => {
    let angle = 0;
    return statusEntries.map(([status, n]) => {
      const sweep = (n / donutTotal) * 360;
      const start = angle;
      angle += sweep;
      return { status, n, start, sweep };
    });
  }, [statusEntries, donutTotal]);

  const kpis = [
    {
      label: "Applications",
      value: String(stats.total),
      hint: "Across every state",
      href: "/admin/applications",
      icon: FileStack,
      tone: "blue",
    },
    {
      label: "Needs attention",
      value: String(needsAttention),
      hint: "Received, missing, or in process",
      href: "/admin/applications",
      icon: Clock3,
      tone: "orange",
    },
    {
      label: "Awaiting payment",
      value: String(pendingCount),
      hint: "Pending or failed checkout",
      href: "/admin/applications?status=pending_payment",
      icon: CircleDollarSign,
      tone: "gold",
    },
    {
      label: "Paid orders",
      value: String(stats.paidCount),
      hint: `${money(stats.revenueCents)} collected`,
      href: "/admin/applications",
      icon: FolderOpen,
      tone: "green",
    },
  ] as const;

  const widgets: Record<WidgetId, ReactNode> = {
    states: (
      <>
        <div className="admin-widget-head">
          <div className="admin-widget-title">
            <span className="admin-widget-icon admin-widget-icon-teal">
              <MapPin size={14} />
            </span>
            <strong>Queue by state</strong>
          </div>
          <Link href="/admin/applications" prefetch={false} className="admin-widget-link">
            View all
          </Link>
        </div>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {stateEntries.length === 0 ? (
            <p className="admin-sub" style={{ margin: 0 }}>
              No applications yet.
            </p>
          ) : (
            stateEntries.slice(0, 4).map(([slug, n]) => (
              <div key={slug}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span>{stateLabel(slug)}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 650 }}>
                    {n} · {Math.round((n / maxState) * 100)}%
                  </span>
                </div>
                <div className="admin-bar-track">
                  <div className="admin-bar-fill" style={{ width: `${(n / maxState) * 100}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </>
    ),
    status: (
      <>
        <div className="admin-widget-head">
          <div className="admin-widget-title">
            <span className="admin-widget-icon admin-widget-icon-blue">
              <PieChart size={14} />
            </span>
            <strong>Status mix</strong>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, color: "var(--ap-ink)" }}>
          <svg width="84" height="84" viewBox="0 0 120 120" aria-hidden>
            {arcs.map((a) => {
              const r = 46;
              const c = 2 * Math.PI * r;
              const len = (a.sweep / 360) * c;
              const rot = a.start - 90;
              return (
                <circle
                  key={a.status}
                  cx="60"
                  cy="60"
                  r={r}
                  fill="none"
                  stroke={STATUS_COLOR[a.status] || "#64748b"}
                  strokeWidth="14"
                  strokeDasharray={`${len} ${c - len}`}
                  transform={`rotate(${rot} 60 60)`}
                  style={{ opacity: 0.92 }}
                />
              );
            })}
            <circle cx="60" cy="60" r="32" fill="var(--ap-card)" />
            <text x="60" y="56" textAnchor="middle" fontSize="18" fontWeight="700" fill="currentColor">
              {donutTotal === 1 && stats.total === 0
                ? "0"
                : `${Math.round(((stats.byStatus.delivered ?? 0) / donutTotal) * 100)}%`}
            </text>
            <text x="60" y="74" textAnchor="middle" fontSize="8" fill="var(--ap-muted)">
              DELIVERED
            </text>
          </svg>
          <div style={{ display: "grid", gap: 5, flex: 1 }}>
            {statusEntries.slice(0, 4).map(([status, n]) => (
              <div key={status} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, gap: 8 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 99,
                      background: STATUS_COLOR[status] || "#64748b",
                    }}
                  />
                  {labelStatus(status)}
                </span>
                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 650 }}>{n}</span>
              </div>
            ))}
          </div>
        </div>
      </>
    ),
    queue: (
      <>
        <div className="admin-widget-head">
          <div className="admin-widget-title">
            <span className="admin-widget-icon admin-widget-icon-orange">
              <ListChecks size={14} />
            </span>
            <strong>Action queue</strong>
          </div>
          <Link href="/admin/applications" prefetch={false} className="admin-widget-link">
            View all
          </Link>
        </div>
        {actionQueue.length === 0 ? (
          <p className="admin-sub" style={{ marginTop: 8 }}>
            Nothing waiting on the team.
          </p>
        ) : (
          <ul className="admin-task-list">
            {actionQueue.map((app) => (
              <li key={app.id}>
                <Link href={`/admin/applications/${app.id}`} prefetch={false}>
                  <span className="admin-task-title">
                    {customerName(app.firstName, app.lastName) || app.reference}
                  </span>
                  <span className="admin-task-meta">
                    {stateLabel(app.stateSlug)} · {labelStatus(app.status)}
                  </span>
                </Link>
                <StatusPill status={app.status} />
              </li>
            ))}
          </ul>
        )}
      </>
    ),
    scans: (
      <>
        <div className="admin-widget-head">
          <div className="admin-widget-title">
            <span className="admin-widget-icon admin-widget-icon-violet">
              <Images size={14} />
            </span>
            <strong>Recent ID scans</strong>
          </div>
          <Link href="/admin/documents" prefetch={false} className="admin-widget-link">
            View all
          </Link>
        </div>
        {docs.length === 0 ? (
          <p className="admin-sub" style={{ marginTop: 12 }}>
            No scanned documents yet.
          </p>
        ) : (
          <ul className="admin-file-list">
            {docs.slice(0, 4).map((row) => (
              <li key={row.id}>
                <Images size={16} />
                <Link href={`/admin/applications/${row.id}?tab=documents`} prefetch={false}>
                  <span className="admin-task-title">{row.reference}</span>
                  <span className="admin-task-meta">
                    {customerName(row.firstName, row.lastName)} · {row.documents.length} file
                    {row.documents.length === 1 ? "" : "s"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </>
    ),
    fulfill: (
      <>
        <div className="admin-widget-head">
          <div className="admin-widget-title">
            <span className="admin-widget-icon admin-widget-icon-rose">
              <Send size={14} />
            </span>
            <strong>Open for fulfillment</strong>
          </div>
          <Link href="/admin/deliver" prefetch={false} className="admin-widget-link">
            Deliver
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="admin-sub" style={{ marginTop: 12 }}>
            No paid orders yet.
          </p>
        ) : (
          <ul className="admin-file-list">
            {orders.slice(0, 4).map((app) => (
              <li key={app.id}>
                <div>
                  <CopyableValue value={app.reference} strong={false} />
                  <div className="admin-task-meta">
                    {customerName(app.firstName, app.lastName)} · {money(app.amountCents)}
                  </div>
                </div>
                <Link
                  href={`/admin/applications/${app.id}`}
                  prefetch={false}
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: "0.35rem 0.7rem", fontSize: 12 }}
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </>
    ),
    paid: (
      <>
        <div className="admin-widget-head">
          <div className="admin-widget-title">
            <span className="admin-widget-icon admin-widget-icon-green">
              <Receipt size={14} />
            </span>
            <strong>Recent paid orders</strong>
          </div>
          <Link href="/admin/applications" prefetch={false} className="admin-widget-link">
            View all
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="admin-sub" style={{ marginTop: 12 }}>
            No paid orders yet.
          </p>
        ) : (
          <ul className="admin-file-list">
            {orders.slice(0, 4).map((app) => (
              <li key={app.id}>
                <Link href={`/admin/applications/${app.id}`} prefetch={false}>
                  <span className="admin-task-title">{customerName(app.firstName, app.lastName) || app.email}</span>
                  <span className="admin-task-meta">
                    {stateLabel(app.stateSlug)} · {money(app.amountCents)}
                  </span>
                </Link>
                <StatusPill status={app.status} />
              </li>
            ))}
          </ul>
        )}
      </>
    ),
  };

  return (
    <div>
      <div className="admin-dash-head admin-rise">
        <div>
          <p className="admin-dash-kicker">Live operations</p>
          <h1 className="admin-title">Welcome back, {firstNameOf(me)}</h1>
          <p className="admin-sub">Here&apos;s what&apos;s happening with your applications.</p>
        </div>
        <button
          type="button"
          className="admin-btn-icon"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh dashboard"
          title="Refresh"
        >
          <RefreshCw size={16} className={refreshing ? "admin-spin" : undefined} />
        </button>
      </div>

      {stats.mongoError ? (
        <p className="admin-alert admin-alert-warn">
          Database temporarily unreachable. Showing fallback data if available.
        </p>
      ) : null}

      <div className="admin-kpi-grid admin-kpi-grid-4">
        {kpis.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              prefetch={false}
              className={`admin-card admin-kpi admin-kpi-link admin-kpi-tone-${card.tone} admin-rise admin-rise-${(i % 4) + 1}`}
            >
              <div className="admin-kpi-top">
                <div className="admin-kpi-label">{card.label}</div>
                <span className={`admin-kpi-icon admin-kpi-icon-${card.tone}`}>
                  <Icon size={16} />
                </span>
              </div>
              <div className="admin-stat-value">{card.value}</div>
              <div className="admin-kpi-hint">{card.hint}</div>
            </Link>
          );
        })}
      </div>

      <p className="admin-dash-layout-hint">Drag the grip on any card to rearrange this board. Layout is saved on this browser.</p>

      <div className="admin-dash-board">
        {order.map((id) => (
          <WidgetCard key={id} id={id} compact={COMPACT.has(id)} onMove={moveCard}>
            {widgets[id]}
          </WidgetCard>
        ))}
      </div>
    </div>
  );
}
