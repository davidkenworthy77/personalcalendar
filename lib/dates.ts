// All dates in the app are plain "YYYY-MM-DD" strings (day granularity, no
// timezones). Date objects are only used transiently for calendar math, always
// constructed at UTC noon so DST can never shift the day.

export type YMD = string;

export function toDate(ymd: YMD): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function fromDate(date: Date): YMD {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function today(): YMD {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(ymd: YMD, days: number): YMD {
  const date = toDate(ymd);
  date.setUTCDate(date.getUTCDate() + days);
  return fromDate(date);
}

/** Days from a to b (positive when b is after a). */
export function diffDays(a: YMD, b: YMD): number {
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86400000);
}

export function minYMD(a: YMD, b: YMD): YMD {
  return a <= b ? a : b;
}

export function maxYMD(a: YMD, b: YMD): YMD {
  return a >= b ? a : b;
}

/** Inclusive range overlap test — everything in the app is inclusive ranges. */
export function rangesOverlap(aStart: YMD, aEnd: YMD, bStart: YMD, bEnd: YMD): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function year(ymd: YMD): number {
  return Number(ymd.slice(0, 4));
}

export function monthIndex(ymd: YMD): number {
  return Number(ymd.slice(5, 7)) - 1;
}

export function dayOfMonth(ymd: YMD): number {
  return Number(ymd.slice(8, 10));
}

/** 0 = Monday … 6 = Sunday (calendar weeks start Monday). */
export function weekdayMon0(ymd: YMD): number {
  return (toDate(ymd).getUTCDay() + 6) % 7;
}

export function startOfMonth(ymd: YMD): YMD {
  return `${ymd.slice(0, 7)}-01`;
}

export function daysInMonth(y: number, m0: number): number {
  return new Date(Date.UTC(y, m0 + 1, 0, 12)).getUTCDate();
}

export function endOfMonth(ymd: YMD): YMD {
  const y = year(ymd);
  const m0 = monthIndex(ymd);
  return fromDate(new Date(Date.UTC(y, m0, daysInMonth(y, m0), 12)));
}

export function addMonths(ymd: YMD, months: number): YMD {
  const y = year(ymd);
  const m0 = monthIndex(ymd) + months;
  const yy = y + Math.floor(m0 / 12);
  const mm = ((m0 % 12) + 12) % 12;
  const dd = Math.min(dayOfMonth(ymd), daysInMonth(yy, mm));
  return fromDate(new Date(Date.UTC(yy, mm, dd, 12)));
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function formatShort(ymd: YMD): string {
  return `${MONTH_SHORT[monthIndex(ymd)]} ${dayOfMonth(ymd)}`;
}

export function formatMedium(ymd: YMD): string {
  return `${MONTH_SHORT[monthIndex(ymd)]} ${dayOfMonth(ymd)}, ${year(ymd)}`;
}

export function formatRange(start: YMD, end: YMD): string {
  if (start === end) return formatMedium(start);
  if (start.slice(0, 7) === end.slice(0, 7)) {
    return `${MONTH_SHORT[monthIndex(start)]} ${dayOfMonth(start)}–${dayOfMonth(end)}, ${year(start)}`;
  }
  if (year(start) === year(end)) {
    return `${formatShort(start)} – ${formatShort(end)}, ${year(start)}`;
  }
  return `${formatMedium(start)} – ${formatMedium(end)}`;
}

/**
 * The weeks covering a month, each week an array of 7 YMDs (Mon–Sun),
 * including leading/trailing days from neighboring months.
 */
export function monthWeeks(y: number, m0: number): YMD[][] {
  const first = fromDate(new Date(Date.UTC(y, m0, 1, 12)));
  let cursor = addDays(first, -weekdayMon0(first));
  const last = endOfMonth(first);
  const weeks: YMD[][] = [];
  while (cursor <= last) {
    const week: YMD[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/** All days of a month as YMDs. */
export function monthDays(y: number, m0: number): YMD[] {
  const n = daysInMonth(y, m0);
  const days: YMD[] = [];
  for (let d = 1; d <= n; d++) {
    days.push(`${y}-${String(m0 + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return days;
}
