import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { mongoConfigured, mongoListApps } from "@/lib/mongo";

export const runtime = "nodejs";

const NAVY = "0A2540";
const SEA = "0F766E";
const HEADER_FG = "FFFFFF";
const ZEBRA = "F8FAFC";
const BORDER = "CBD5E1";
const MUTED = "64748B";

const STATUS_FILL: Record<string, string> = {
  pending_payment: "FEF3C7",
  payment_failed: "FEE2E2",
  received: "CCFBF1",
  processing: "DBEAFE",
  missing_info: "FFEDD5",
  future_pending: "E0F2FE",
  delivered: "DCFCE7",
  cancelled: "F1F5F9",
  refunded: "EDE9FE",
};

function labelStatus(s: string) {
  return s.replace(/_/g, " ");
}

function titleCaseStatus(s: string) {
  return labelStatus(s).replace(/\b\w/g, (c) => c.toUpperCase());
}

function stateLabel(slug: string) {
  return slug
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const edge: Partial<ExcelJS.Border> = { style: "thin", color: { argb: `FF${BORDER}` } };
  return { top: edge, left: edge, bottom: edge, right: edge };
}

function parseFilters(url: URL) {
  const q = url.searchParams.get("q")?.trim() || "";
  const status = url.searchParams.get("status")?.trim() || "";
  const state = url.searchParams.get("state")?.trim() || "";
  const from = url.searchParams.get("from")?.trim() || "";
  const to = url.searchParams.get("to")?.trim() || "";
  const minAmount = url.searchParams.get("minAmount");
  const maxAmount = url.searchParams.get("maxAmount");
  const sort = url.searchParams.get("sort")?.trim() || "newest";

  const parts: string[] = [];
  if (q) parts.push(`Search: “${q}”`);
  if (status) parts.push(`Status: ${titleCaseStatus(status)}`);
  if (state) parts.push(`State: ${stateLabel(state)}`);
  if (from || to) parts.push(`Submitted: ${from || "…"} → ${to || "…"}`);
  if (minAmount || maxAmount) {
    const min = minAmount ? `$${(Number(minAmount) / 100).toFixed(2)}` : "…";
    const max = maxAmount ? `$${(Number(maxAmount) / 100).toFixed(2)}` : "…";
    parts.push(`Amount: ${min} – ${max}`);
  }
  parts.push(`Sort: ${sort.replace(/_/g, " ")}`);

  return { q, status, state, from, to, minAmount, maxAmount, sort, summary: parts.join("  ·  ") };
}

/**
 * GET /api/admin/applications/export
 * Professionally formatted Excel (.xlsx) of CRM applications (respects list filters).
 */
export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!mongoConfigured()) {
    return NextResponse.json(
      { ok: false, error: "MongoDB is not configured. Set MONGODB_URI." },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const filters = parseFilters(url);
  const num = (v: string | null) => {
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  try {
    const result = await mongoListApps({
      q: filters.q || undefined,
      status: filters.status || undefined,
      state: filters.state || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      minAmount: num(filters.minAmount),
      maxAmount: num(filters.maxAmount),
      page: 1,
      pageSize: 10_000,
      sort: filters.sort as "newest" | "oldest" | "amount_desc" | "amount_asc",
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ReelPermit CRM";
    workbook.lastModifiedBy = "ReelPermit CRM";
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.company = "ReelPermit";

    const sheet = workbook.addWorksheet("Applications", {
      properties: { defaultRowHeight: 18 },
      pageSetup: {
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        paperSize: 9,
        margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
      },
      headerFooter: {
        oddHeader: "&LReelPermit CRM&RApplications export",
        oddFooter: "&LConfidential — internal use only&CPage &P of &N&R&D",
      },
    });

    const colCount = 14;
    const headerRowIndex = 6;
    const dataStart = headerRowIndex + 1;

    // Column widths (A–N)
    const widths = [16, 14, 14, 30, 16, 16, 18, 14, 16, 28, 14, 14, 20, 20];
    widths.forEach((w, i) => {
      sheet.getColumn(i + 1).width = w;
    });

    // —— Title block ——
    sheet.mergeCells(1, 1, 1, colCount);
    const title = sheet.getRow(1);
    title.height = 28;
    title.getCell(1).value = "ReelPermit — Applications Export";
    title.getCell(1).font = { name: "Calibri", size: 18, bold: true, color: { argb: `FF${NAVY}` } };
    title.getCell(1).alignment = { vertical: "middle", horizontal: "left" };

    sheet.mergeCells(2, 1, 2, colCount);
    const generated = sheet.getRow(2);
    generated.getCell(1).value = `Generated ${new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "medium",
      timeStyle: "short",
    })} ET`;
    generated.getCell(1).font = { name: "Calibri", size: 10, color: { argb: `FF${MUTED}` } };

    sheet.mergeCells(3, 1, 3, colCount);
    const filterRow = sheet.getRow(3);
    filterRow.getCell(1).value = `Filters: ${filters.summary}`;
    filterRow.getCell(1).font = { name: "Calibri", size: 10, color: { argb: `FF${MUTED}` } };
    filterRow.getCell(1).alignment = { wrapText: true };
    filterRow.height = 22;

    const gross = result.items.reduce((s, a) => s + a.amountCents, 0) / 100;
    sheet.mergeCells(4, 1, 4, colCount);
    const meta = sheet.getRow(4);
    meta.getCell(1).value = {
      richText: [
        { text: `${result.items.length.toLocaleString()} record${result.items.length === 1 ? "" : "s"}`, font: { bold: true, color: { argb: `FF${NAVY}` } } },
        { text: "  ·  ", font: { color: { argb: `FF${MUTED}` } } },
        { text: `Gross volume ${gross.toLocaleString("en-US", { style: "currency", currency: "USD" })}`, font: { bold: true, color: { argb: `FF${SEA}` } } },
        ...(result.total > result.items.length
          ? [
              { text: "  ·  ", font: { color: { argb: `FF${MUTED}` } } },
              {
                text: `showing first ${result.items.length.toLocaleString()} of ${result.total.toLocaleString()}`,
                font: { color: { argb: `FF${MUTED}` } },
              },
            ]
          : []),
      ],
    };
    meta.getCell(1).font = { name: "Calibri", size: 11 };

    // Spacer
    sheet.getRow(5).height = 8;

    // —— Table header ——
    const headers = [
      "Reference",
      "First name",
      "Last name",
      "Email",
      "Phone",
      "State",
      "License ID",
      "Residency",
      "Status",
      "Status reason",
      "License expiry",
      "Amount (USD)",
      "Submitted",
      "Paid at",
    ];
    const headerRow = sheet.getRow(headerRowIndex);
    headerRow.height = 22;
    headers.forEach((label, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = label;
      cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: `FF${HEADER_FG}` } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${NAVY}` } };
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
      cell.border = thinBorder();
    });

    // —— Data rows ——
    result.items.forEach((app, idx) => {
      const row = sheet.getRow(dataStart + idx);
      row.height = 18;
      const submitted = app.submittedAt ? new Date(app.submittedAt) : null;
      const paidAt = app.paidAt ? new Date(app.paidAt) : null;
      const expiry = app.existingLicenseExpiresOn
        ? new Date(`${app.existingLicenseExpiresOn}T12:00:00.000Z`)
        : null;

      const values: (string | number | Date | null)[] = [
        app.reference,
        app.firstName ?? "",
        app.lastName ?? "",
        app.email ?? "",
        app.phone ?? "",
        stateLabel(app.stateSlug),
        app.licenseId,
        app.residency || "",
        titleCaseStatus(app.status),
        app.statusReason ?? "",
        expiry,
        app.amountCents / 100,
        submitted,
        paidAt,
      ];

      values.forEach((value, i) => {
        const cell = row.getCell(i + 1);
        cell.value = value === "" ? null : value;
        cell.font = { name: "Calibri", size: 10, color: { argb: `FF${NAVY}` } };
        cell.alignment = { vertical: "middle", horizontal: i === 11 ? "right" : "left" };
        cell.border = thinBorder();
        if (idx % 2 === 1) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${ZEBRA}` } };
        }
      });

      // Currency
      row.getCell(12).numFmt = '"$"#,##0.00';
      // Dates
      if (expiry) row.getCell(11).numFmt = "YYYY-MM-DD";
      if (submitted) row.getCell(13).numFmt = "YYYY-MM-DD HH:MM";
      if (paidAt) row.getCell(14).numFmt = "YYYY-MM-DD HH:MM";

      // Status tint
      const statusFill = STATUS_FILL[app.status];
      if (statusFill) {
        row.getCell(9).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: `FF${statusFill}` },
        };
        row.getCell(9).font = { name: "Calibri", size: 10, bold: true, color: { argb: `FF${NAVY}` } };
      }
    });

    const lastDataRow = dataStart + Math.max(result.items.length, 1) - 1;

    // Totals row
    if (result.items.length > 0) {
      const totalRowIndex = lastDataRow + 1;
      const totalRow = sheet.getRow(totalRowIndex);
      totalRow.height = 20;
      sheet.mergeCells(totalRowIndex, 1, totalRowIndex, 11);
      totalRow.getCell(1).value = "Total";
      totalRow.getCell(1).font = { name: "Calibri", size: 11, bold: true, color: { argb: `FF${NAVY}` } };
      totalRow.getCell(1).alignment = { vertical: "middle", horizontal: "right" };
      totalRow.getCell(12).value = { formula: `SUM(L${dataStart}:L${lastDataRow})` };
      totalRow.getCell(12).numFmt = '"$"#,##0.00';
      totalRow.getCell(12).font = { name: "Calibri", size: 11, bold: true, color: { argb: `FF${SEA}` } };
      for (let c = 1; c <= colCount; c++) {
        totalRow.getCell(c).border = thinBorder();
        totalRow.getCell(c).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFECFDF5" },
        };
      }
    }

    // Freeze header row (no AutoFilter — keeps headers clean without sort dropdowns)
    sheet.views = [{ state: "frozen", xSplit: 0, ySplit: headerRowIndex, activeCell: "A7" }];

    // Summary sheet
    const summary = workbook.addWorksheet("Export Summary", {
      properties: { defaultRowHeight: 18 },
    });
    summary.getColumn(1).width = 28;
    summary.getColumn(2).width = 56;

    const summaryTitle = summary.getRow(1);
    summary.mergeCells(1, 1, 1, 2);
    summaryTitle.getCell(1).value = "Export Summary";
    summaryTitle.getCell(1).font = { name: "Calibri", size: 16, bold: true, color: { argb: `FF${NAVY}` } };

    const summaryLines: [string, string | number][] = [
      ["Generated", new Date().toISOString()],
      ["Records exported", result.items.length],
      ["Matching total", result.total],
      ["Gross volume (USD)", gross],
      ["Search", filters.q || "—"],
      ["Status", filters.status ? titleCaseStatus(filters.status) : "All"],
      ["State", filters.state ? stateLabel(filters.state) : "All"],
      ["Submitted from", filters.from || "—"],
      ["Submitted to", filters.to || "—"],
      ["Sort", filters.sort.replace(/_/g, " ")],
    ];
    summaryLines.forEach(([label, value], i) => {
      const row = summary.getRow(i + 3);
      row.getCell(1).value = label;
      row.getCell(1).font = { name: "Calibri", size: 11, bold: true, color: { argb: `FF${MUTED}` } };
      row.getCell(2).value = value;
      row.getCell(2).font = { name: "Calibri", size: 11, color: { argb: `FF${NAVY}` } };
      if (label === "Gross volume (USD)") row.getCell(2).numFmt = '"$"#,##0.00';
      row.getCell(1).border = thinBorder();
      row.getCell(2).border = thinBorder();
    });

    // Status breakdown
    const byStatus = new Map<string, number>();
    for (const app of result.items) {
      byStatus.set(app.status, (byStatus.get(app.status) ?? 0) + 1);
    }
    let br = summaryLines.length + 5;
    summary.getRow(br).getCell(1).value = "Status breakdown";
    summary.getRow(br).getCell(1).font = {
      name: "Calibri",
      size: 12,
      bold: true,
      color: { argb: `FF${NAVY}` },
    };
    br += 1;
    summary.getRow(br).getCell(1).value = "Status";
    summary.getRow(br).getCell(2).value = "Count";
    summary.getRow(br).getCell(1).font = { bold: true, color: { argb: `FF${HEADER_FG}` } };
    summary.getRow(br).getCell(2).font = { bold: true, color: { argb: `FF${HEADER_FG}` } };
    summary.getRow(br).getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${NAVY}` },
    };
    summary.getRow(br).getCell(2).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${NAVY}` },
    };
    Array.from(byStatus.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count], i) => {
        const row = summary.getRow(br + 1 + i);
        row.getCell(1).value = titleCaseStatus(status);
        row.getCell(2).value = count;
        row.getCell(1).border = thinBorder();
        row.getCell(2).border = thinBorder();
        const fill = STATUS_FILL[status];
        if (fill) {
          row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${fill}` } };
        }
      });

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const stamp = new Date().toISOString().slice(0, 10);
    const statusPart = (filters.status || "all").replace(/[^a-z0-9_-]+/gi, "-");
    const filename = `ReelPermit-Applications-${statusPart}-${stamp}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Export-Count": String(result.items.length),
        "X-Export-Total": String(result.total),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    // eslint-disable-next-line no-console
    console.error(`[api/admin/applications/export] ${message}`);
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
