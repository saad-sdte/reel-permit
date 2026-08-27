import { NextResponse } from "next/server";
import { getAdminSessionUser, isAdminAuthenticated } from "@/lib/admin-auth";
import {
  mongoConfigured,
  invalidateDashCache,
  mongoDashboardBundle,
  mongoGetById,
  mongoGetByReference,
  mongoListApps,
  mongoPatchStatus,
  mongoRecentPaid,
  mongoStats,
} from "@/lib/mongo";
import {
  deleteApplication,
  updateApplicationStatus,
  type ApplicationStatus,
} from "@/lib/storage";
import { dbConfigured } from "@/lib/db";
import { getStateConfig } from "@/lib/states";
import {
  computeLicenseEndDate,
  formatLicenseDateRange,
  parseIsoDate,
  parseMmDdYyyy,
} from "@/lib/state-config";
import { extractApplicantDocuments } from "@/lib/applicant-documents";

interface LicenseSummary {
  name: string;
  duration: string;
  startDate: string | null;
  endDate: string | null;
  formatted: string | null;
}

/**
 * Resolve display-ready license details for an application row: SKU name +
 * duration from the state config, and a formatted date range computed from
 * the applicant's chosen start date. Returns null when the state or SKU
 * cannot be resolved so callers can fall back to the raw licenseId.
 */
async function resolveLicenseSummary(
  stateSlug: string,
  licenseId: string,
  formData: Record<string, unknown> | undefined,
): Promise<LicenseSummary | null> {
  const config = await getStateConfig(stateSlug);
  const sku = config?.licenses.find((l) => l.id === licenseId);
  if (!sku) return null;
  const raw = formData?.licenseStartDate;
  const start =
    typeof raw === "string" && raw.includes("-") ? parseIsoDate(raw) : parseMmDdYyyy(raw);
  const end = computeLicenseEndDate(start, sku.duration);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return {
    name: sku.name,
    duration: sku.duration,
    startDate: start ? iso(start) : null,
    endDate: end ? iso(end) : null,
    formatted: formatLicenseDateRange(raw, sku.duration),
  };
}

async function guard() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!mongoConfigured()) {
    return NextResponse.json(
      { ok: false, error: "MongoDB is not configured. Set MONGODB_URI." },
      { status: 503 },
    );
  }
  return null;
}

export async function GET(req: Request) {
  const denied = await guard();
  if (denied) return denied;

  const url = new URL(req.url);
  const view = url.searchParams.get("view") ?? "list";

  try {
    if (view === "stats") {
      return NextResponse.json({ ok: true, ...(await mongoStats()) });
    }

    if (view === "dashboard") {
      const limit = Number(url.searchParams.get("limit") ?? 10);
      const bypass = url.searchParams.get("fresh") === "1";
      const bundle = await mongoDashboardBundle({
        limit: Number.isFinite(limit) ? limit : 10,
        bypassCache: bypass,
      });
      return NextResponse.json({ ok: true, ...bundle });
    }

    if (view === "recentPaid") {
      const limit = Number(url.searchParams.get("limit") ?? 10);
      const items = await mongoRecentPaid(Number.isFinite(limit) ? limit : 10);
      return NextResponse.json({ ok: true, items });
    }

    if (view === "one") {
      const id = url.searchParams.get("id");
      if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
      const app = await mongoGetById(id);
      if (!app) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
      const licenseSummary = await resolveLicenseSummary(
        app.stateSlug,
        app.licenseId,
        app.formData,
      );
      return NextResponse.json({ ok: true, app, licenseSummary });
    }

    if (view === "byRef") {
      const reference = url.searchParams.get("reference")?.trim();
      if (!reference) {
        return NextResponse.json({ ok: false, error: "reference required" }, { status: 400 });
      }
      const app = await mongoGetByReference(reference);
      if (!app) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
      const licenseSummary = await resolveLicenseSummary(
        app.stateSlug,
        app.licenseId,
        app.formData,
      );
      return NextResponse.json({ ok: true, app, licenseSummary });
    }

    if (view === "documents") {
      const result = await mongoListApps({
        q: url.searchParams.get("q") ?? undefined,
        status: url.searchParams.get("status") ?? undefined,
        state: url.searchParams.get("state") ?? undefined,
        page: num(url.searchParams.get("page")) ?? 1,
        pageSize: num(url.searchParams.get("pageSize")) ?? 25,
        sort:
          (url.searchParams.get("sort") as "newest" | "oldest" | "amount_desc" | "amount_asc") ||
          "newest",
        hasDocuments: true,
      });
      const items = result.items.map((app) => ({
        id: app.id,
        reference: app.reference,
        firstName: app.firstName,
        lastName: app.lastName,
        email: app.email,
        stateSlug: app.stateSlug,
        status: app.status,
        submittedAt: app.submittedAt,
        documents: extractApplicantDocuments(app.formData),
      }));
      return NextResponse.json({ ok: true, ...result, items });
    }

    const result = await mongoListApps({
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      state: url.searchParams.get("state") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      minAmount: num(url.searchParams.get("minAmount")),
      maxAmount: num(url.searchParams.get("maxAmount")),
      page: num(url.searchParams.get("page")) ?? 1,
      pageSize: num(url.searchParams.get("pageSize")) ?? 25,
      sort:
        (url.searchParams.get("sort") as "newest" | "oldest" | "amount_desc" | "amount_asc") ||
        "newest",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Data load failed";
    // eslint-disable-next-line no-console
    console.error(`[api/admin/data] ${message}`);
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}

export async function PATCH(req: Request) {
  const denied = await guard();
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    status?: ApplicationStatus;
    reason?: string;
  };
  if (!body.id || !body.status) {
    return NextResponse.json({ ok: false, error: "id and status required" }, { status: 400 });
  }

  try {
    // Prefer shared lifecycle writer so Postgres + Mongo stay aligned when DB is configured.
    if (dbConfigured()) {
      await updateApplicationStatus(body.id, body.status, body.reason);
      invalidateDashCache();
      const app = await mongoGetById(body.id);
      if (app) return NextResponse.json({ ok: true, app });
    }
    const app = await mongoPatchStatus(body.id, body.status, body.reason);
    if (!app) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    invalidateDashCache();
    return NextResponse.json({ ok: true, app });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Status update failed";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  const denied = await guard();
  if (denied) return denied;

  const me = await getAdminSessionUser();
  if (!me) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id")?.trim() || "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  }

  try {
    const archived = await deleteApplication(id);
    if (!archived) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    invalidateDashCache();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Archive failed";
    // eslint-disable-next-line no-console
    console.error(`[api/admin/data] archive ${message}`);
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}

function num(v: string | null): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
