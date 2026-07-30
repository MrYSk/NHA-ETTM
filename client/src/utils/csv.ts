/** Escape a value for CSV: quote it and double any embedded quotes. */
function escapeCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => unknown;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const head = columns.map((c) => escapeCell(c.header)).join(',');
  const body = rows.map((row) => columns.map((c) => escapeCell(c.value(row))).join(','));
  return [head, ...body].join('\r\n');
}

/*
 * Build a CSV from raw cells. Used for sectioned reports — a heading per
 * person followed by their own rows — which a fixed column set cannot express.
 */
export function toCsvRows(rows: unknown[][]): string {
  return rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

/*
 * Trigger a browser download of a text file. A BOM is prepended so Excel opens
 * UTF-8 CSVs with the correct encoding.
 */
export function downloadCsv(filename: string, csv: string): void {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
