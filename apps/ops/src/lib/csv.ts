/**
 * CSV helpers for ops ModuleBoard import/export.
 */

function escapeCsvCell(value: unknown): string {
  const raw = value == null ? "" : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replaceAll('"', '""')}"`;
  }
  return raw;
}

export function rowsToCsv(
  rows: Record<string, unknown>[],
  columns?: string[],
): string {
  if (rows.length === 0) {
    return (columns ?? []).map(escapeCsvCell).join(",");
  }
  const keys = columns ?? Object.keys(rows[0] ?? {});
  const header = keys.map(escapeCsvCell).join(",");
  const body = rows
    .map((row) => keys.map((key) => escapeCsvCell(row[key])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

function triggerDownload(filename: string, blob: Blob): void {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

export function downloadCsv(
  filename: string,
  rows: Record<string, unknown>[],
  columns?: string[],
): void {
  const csv = rowsToCsv(rows, columns);
  triggerDownload(
    filename.endsWith(".csv") ? filename : `${filename}.csv`,
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
}

/**
 * Minimal RFC4180-ish CSV parser for ops import flows.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const rows = splitCsvRows(text);
  if (rows.length === 0) return [];
  const headers = rows[0]!.map((header) => header.trim());
  return rows
    .slice(1)
    .filter((cells) => cells.some((cell) => cell.trim() !== ""))
    .map((cells) => {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = (cells[index] ?? "").trim();
      });
      return row;
    });
}

function splitCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]!;
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    if (char === "\r") continue;
    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

export function downloadText(
  filename: string,
  content: string,
  mime = "text/plain",
): void {
  triggerDownload(filename, new Blob([content], { type: `${mime};charset=utf-8` }));
}

export function downloadTsv(
  filename: string,
  rows: Record<string, unknown>[],
  columns?: string[],
): void {
  if (rows.length === 0) {
    triggerDownload(
      filename.endsWith(".tsv") ? filename : `${filename}.tsv`,
      new Blob([(columns ?? []).join("\t")], {
        type: "text/tab-separated-values;charset=utf-8",
      }),
    );
    return;
  }
  const keys = columns ?? Object.keys(rows[0] ?? {});
  const lines = [
    keys.join("\t"),
    ...rows.map((row) =>
      keys
        .map((key) => String(row[key] ?? "").replaceAll("\t", " ").replaceAll("\n", " "))
        .join("\t"),
    ),
  ];
  triggerDownload(
    filename.endsWith(".tsv") ? filename : `${filename}.tsv`,
    new Blob([lines.join("\n")], {
      type: "text/tab-separated-values;charset=utf-8",
    }),
  );
}

export function printReportWindow(title: string, bodyHtml: string): void {
  const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!win) return;
  win.document.write(
    `<!doctype html><html><head><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;padding:1.5rem;color:#101828}
table{border-collapse:collapse;width:100%}th,td{border:1px solid #e4e7ec;padding:.4rem .55rem;text-align:left;font-size:.9rem}
h1{font-size:1.25rem}</style></head><body>
<h1>${title}</h1>${bodyHtml}` +
      "<script>window.onload=function(){window.print()}</script></body></html>",
  );
  win.document.close();
}

export { escapeCsvCell };
