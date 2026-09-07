import { useMemo, useState } from "react";
import { analyticsSnapshotFixture } from "@hamd/ui/analytics";
import { auditEventsFixture } from "@hamd/ui/audit";
import { catalogFixtureProducts } from "@hamd/ui/catalog";
import { purchaseOrderRecordsFixture } from "@hamd/ui/purchase-orders";
import { supplierRecordsFixture } from "@hamd/ui/suppliers";

import { exportOpsReport, OpsApiError, requireToken } from "../api/ops-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsAlert, OpsPage, OpsStatus } from "../components/OpsChrome.js";
import {
  downloadCsv,
  downloadTsv,
  printReportWindow,
  rowsToCsv,
} from "../lib/csv.js";

type DomainKey =
  | "suppliers"
  | "products"
  | "purchase-orders"
  | "audit"
  | "analytics";

type FormatKey = "csv" | "excel" | "pdf";

function domainRows(domain: DomainKey): Record<string, unknown>[] {
  switch (domain) {
    case "suppliers":
      return supplierRecordsFixture.map((row) => ({
        id: row.id,
        name: row.legalName,
        status: row.status,
        country: row.countryCode,
        risk: row.riskTier,
      }));
    case "products":
      return catalogFixtureProducts.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.categoryName,
        status: row.availability,
      }));
    case "purchase-orders":
      return purchaseOrderRecordsFixture.map((row) => ({
        id: row.id,
        publicCode: row.publicCode,
        status: row.status,
        totalAmount: row.totalAmount,
        currencyCode: row.currencyCode,
      }));
    case "audit":
      return auditEventsFixture.map((row) => ({
        id: row.id,
        action: row.action,
        actor: row.actor.name,
        outcome: row.outcome,
        occurredAt: row.occurredAt,
      }));
    case "analytics":
      return analyticsSnapshotFixture.metrics.map((row) => ({
        id: row.key,
        label: row.label,
        value: row.value,
        generatedAt: analyticsSnapshotFixture.generatedAt,
      }));
    default:
      return [];
  }
}

function rowsToHtmlTable(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "<p>No rows.</p>";
  const keys = Object.keys(rows[0]!);
  const head = `<tr>${keys.map((k) => `<th>${k}</th>`).join("")}</tr>`;
  const body = rows
    .map(
      (row) =>
        `<tr>${keys.map((k) => `<td>${String(row[k] ?? "")}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

export function ReportsPage() {
  const auth = useAuth();
  const [domain, setDomain] = useState<DomainKey>("suppliers");
  const [format, setFormat] = useState<FormatKey>("csv");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewCount = useMemo(() => domainRows(domain).length, [domain]);

  const generate = async () => {
    setError(null);
    const rows = domainRows(domain);
    const stamp = new Date().toISOString().slice(0, 10);
    const rangeNote =
      from || to ? ` Range: ${from || "…"} → ${to || "…"}.` : "";

    try {
      const token = await requireToken(auth.ensureSession);
      await exportOpsReport(token, {
        domain,
        format,
        from: from || undefined,
        to: to || undefined,
      });
    } catch (err) {
      if (!(err instanceof OpsApiError && (err.status === 404 || err.status === 501))) {
        /* Prefer local export when API is unavailable */
        if (err instanceof OpsApiError && (err.status === 401 || err.status === 403)) {
          setError(err.message);
          return;
        }
      }
    }

    if (format === "csv") {
      downloadCsv(`ops-report-${domain}-${stamp}.csv`, rows);
      setMessage(`Generated CSV for ${domain} (${rows.length} rows).${rangeNote}`);
      return;
    }

    if (format === "excel") {
      downloadTsv(`ops-report-${domain}-${stamp}.tsv`, rows);
      setMessage(
        `Generated Excel-compatible TSV for ${domain} (${rows.length} rows).${rangeNote}`,
      );
      return;
    }

    printReportWindow(
      `Ops report - ${domain}`,
      `<p>${rowsToCsv(rows).split("\n").length - 1} data rows · ${stamp}${rangeNote}</p>${rowsToHtmlTable(rows)}`,
    );
    setMessage(`Opened print window for ${domain} PDF export.${rangeNote}`);
  };

  return (
    <OpsPage className="hamd-ops-reports">
      <OpsAlert tone="info">
        Reports call `/api/v1/ops/reports/export` when available, then fall back
        to client-side CSV / TSV / print PDF.
      </OpsAlert>
      {error ? <OpsAlert>{error}</OpsAlert> : null}
      <div className="hamd-ops-reports__row">
        <label>
          Domain
          <select
            value={domain}
            onChange={(event) => setDomain(event.target.value as DomainKey)}
          >
            <option value="suppliers">Suppliers</option>
            <option value="products">Products</option>
            <option value="purchase-orders">Purchase orders</option>
            <option value="audit">Audit</option>
            <option value="analytics">Analytics</option>
          </select>
        </label>
      </div>
      <div className="hamd-ops-reports__row">
        <label>
          Format
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value as FormatKey)}
          >
            <option value="csv">CSV</option>
            <option value="excel">Excel (TSV)</option>
            <option value="pdf">PDF (print)</option>
          </select>
        </label>
      </div>
      <div className="hamd-ops-reports__row">
        <label>
          From
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
      </div>
      <p className="hamd-ops-empty">{previewCount} rows available for export.</p>
      <div className="hamd-ops-module__actions">
        <button
          type="button"
          className="hamd-btn hamd-btn--primary"
          onClick={() => void generate()}
        >
          Generate report
        </button>
        <button
          type="button"
          className="hamd-btn hamd-btn--ghost"
          onClick={() => {
            setFormat("csv");
            void generate();
          }}
        >
          Generate CSV
        </button>
        <button
          type="button"
          className="hamd-btn hamd-btn--ghost"
          onClick={() => {
            setFormat("excel");
            void generate();
          }}
        >
          Generate Excel
        </button>
        <button
          type="button"
          className="hamd-btn hamd-btn--ghost"
          onClick={() => {
            setFormat("pdf");
            void generate();
          }}
        >
          Generate PDF
        </button>
      </div>
      {message ? <OpsStatus tone="success">{message}</OpsStatus> : null}
    </OpsPage>
  );
}
