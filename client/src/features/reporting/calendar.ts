import type { ReportingRecord } from '@/api/reporting.service';

/*
 * Builds the calendar-grid attendance report: for each officer, every calendar
 * day of the month laid out in rows of ten, showing "HH:MM - HH:MM" for days
 * they attended and a blank cell for days they did not.
 *
 * This mirrors the sheet the HR team already circulates, so the download opens
 * in Excel looking like the report they know.
 */

/** Days shown per band, matching the existing HR sheet. */
export const DAYS_PER_ROW = 10;

export interface CalendarCell {
  /** Day of month, 1-based. */
  day: number;
  /** e.g. "01 Wed" — the band's header label. */
  label: string;
  /** e.g. "08:56 - 17:12", or "" when the officer did not attend. */
  times: string;
  isWeekend: boolean;
}

/** Strip seconds: "08:56:26" -> "08:56". Returns "" for missing values. */
function hhmm(value: string | undefined): string {
  if (!value) return '';
  const [h = '', m = ''] = value.split(':');
  return h && m ? `${h}:${m}` : '';
}

/** Number of days in a "YYYY-MM" month. */
export function daysInMonth(month: string): number {
  const [year, m] = month.split('-').map(Number);
  if (!year || !m) return 0;
  return new Date(year, m, 0).getDate();
}

/**
 * Every day of `month` for one officer, in order, whether or not they attended.
 * `records` may contain days outside the month; those are ignored.
 */
export function buildCalendar(month: string, records: ReportingRecord[]): CalendarCell[] {
  const total = daysInMonth(month);
  if (!total) return [];

  const byDay = new Map<number, ReportingRecord>();
  for (const record of records) {
    if (!record.date.startsWith(month)) continue;
    byDay.set(Number(record.date.slice(8, 10)), record);
  }

  const [year, m] = month.split('-').map(Number);

  return Array.from({ length: total }, (_, index) => {
    const day = index + 1;
    const date = new Date(year, m - 1, day);
    const weekday = date.toLocaleDateString('en-GB', { weekday: 'short' });
    const record = byDay.get(day);
    const inTime = hhmm(record?.checkIn);
    const outTime = hhmm(record?.checkOut);

    return {
      day,
      label: `${String(day).padStart(2, '0')} ${weekday}`,
      times: inTime && outTime ? `${inTime} - ${outTime}` : inTime || '',
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    };
  });
}

/** Split the month's days into bands of ten for the grid layout. */
export function toBands(cells: CalendarCell[]): CalendarCell[][] {
  const bands: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += DAYS_PER_ROW) {
    bands.push(cells.slice(i, i + DAYS_PER_ROW));
  }
  return bands;
}

/** Pad a band to a full ten columns so every CSV row has the same width. */
export function padRow(values: string[]): string[] {
  return [...values, ...Array(Math.max(0, DAYS_PER_ROW - values.length)).fill('')];
}
