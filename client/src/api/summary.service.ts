import { apiClient, createListCache, matchesSearch } from './client';
import { getSessionUser } from './auth.service';
import { scopeByEmployee } from '@/lib/access';

/** One monthly summary row: an employee's hours for a schedule period. */
export interface SummaryRecord {
  id: string;
  employeeName: string;
  bioId: string;
  siteName: string;
  designation: string;
  periodStart: string;
  periodEnd: string;
  shiftType: string;
  /** Hours the schedule required. */
  requiredHours: number;
  hqHours: number;
  siteHours: number;
  /** Hours actually worked. */
  workedHours: number;
  /** Hours that counted towards the schedule. */
  acceptableHours: number;
}

export interface SummaryFilters {
  search?: string;
  siteName?: string;
  /** Keep periods that overlap this range (YYYY-MM-DD). */
  dateFrom?: string;
  dateTo?: string;
}

interface SummaryRow {
  id: string;
  fullname: string;
  bio_id: string;
  site_name: string;
  designation_name: string;
  schedule_start_date: string;
  schedule_end_date: string;
  shift_type: string;
  total_hrs: string;
  hq_hrs: string;
  site_hrs: string;
  total_time: string;
  total_acceptable_time: string;
}

interface SummaryResponse {
  summary_rows?: SummaryRow[];
  total_rows?: number;
}

const num = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function mapRow(row: SummaryRow): SummaryRecord {
  return {
    id: row.id,
    employeeName: row.fullname,
    bioId: row.bio_id,
    siteName: row.site_name,
    designation: row.designation_name,
    periodStart: row.schedule_start_date,
    periodEnd: row.schedule_end_date,
    shiftType: row.shift_type,
    requiredHours: num(row.total_hrs),
    hqHours: num(row.hq_hrs),
    siteHours: num(row.site_hrs),
    workedHours: num(row.total_time),
    acceptableHours: num(row.total_acceptable_time),
  };
}

// The upstream caps this endpoint at 10 rows per page (pagesize is ignored) but
// honours `page`, so every page is walked once and cached. `employees` is
// mandatory — without it the API answers 401 "employees array required".
const PAGE_SIZE = 10;
const MAX_PAGES = 60; // safety stop; 60 pages = 600 rows

async function fetchPage(employees: string[], page: number): Promise<SummaryResponse> {
  const { data } = await apiClient.post<SummaryResponse>('/monthly_summary', {
    page,
    pagesize: PAGE_SIZE,
    employees,
  });
  return data;
}

const summaryCache = createListCache(async () => {
  const employees = getSessionUser()?.employeeIds ?? [];
  const first = await fetchPage(employees, 1);
  const rows = [...(first.summary_rows ?? [])];
  const total = first.total_rows ?? rows.length;
  const pages = Math.min(Math.ceil(total / PAGE_SIZE), MAX_PAGES);

  if (pages > 1) {
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, i) => fetchPage(employees, i + 2)),
    );
    for (const page of rest) rows.push(...(page.summary_rows ?? []));
  }

  // De-duplicate by id in case the upstream repeats a row across pages.
  const seen = new Set<string>();
  const unique = rows.filter((row) => !seen.has(row.id) && seen.add(row.id));

  return scopeByEmployee(unique.map(mapRow), (r) => r.bioId).sort((a, b) =>
    b.periodStart.localeCompare(a.periodStart),
  );
});

export async function listSummary(filters: SummaryFilters = {}): Promise<SummaryRecord[]> {
  const all = await summaryCache.get();
  return all.filter(
    (r) =>
      matchesSearch([r.employeeName, r.siteName, r.designation, r.bioId], filters.search) &&
      (!filters.siteName || r.siteName === filters.siteName) &&
      // Keep any period that overlaps the requested range.
      (!filters.dateFrom || r.periodEnd >= filters.dateFrom) &&
      (!filters.dateTo || r.periodStart <= filters.dateTo),
  );
}

/** Distinct site names present in the summary data, for the site filter. */
export async function listSummarySites(): Promise<string[]> {
  const all = await summaryCache.get();
  return Array.from(new Set(all.map((r) => r.siteName).filter(Boolean))).sort();
}
