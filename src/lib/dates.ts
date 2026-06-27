import {
  format,
  parseISO,
  addDays,
  subDays,
  differenceInCalendarDays,
  startOfDay,
} from "date-fns";

export const DATE_FMT = "yyyy-MM-dd";

/** Today's date as YYYY-MM-DD in the user's local timezone. */
export function todayStr(): string {
  return format(new Date(), DATE_FMT);
}

export function toDateStr(d: Date): string {
  return format(d, DATE_FMT);
}

export function shiftDateStr(dateStr: string, days: number): string {
  return format(addDays(parseISO(dateStr), days), DATE_FMT);
}

export function isFutureDate(dateStr: string): boolean {
  return differenceInCalendarDays(parseISO(dateStr), startOfDay(new Date())) > 0;
}

export function isToday(dateStr: string): boolean {
  return dateStr === todayStr();
}

/** Human label like "Today", "Yesterday", or "Mon, Jun 23". */
export function friendlyDate(dateStr: string): string {
  if (dateStr === todayStr()) return "Today";
  if (dateStr === toDateStr(subDays(new Date(), 1))) return "Yesterday";
  return format(parseISO(dateStr), "EEE, MMM d");
}

/** Inclusive list of YYYY-MM-DD strings from `start` going back `count` days. */
export function lastNDates(count: number, endDateStr = todayStr()): string[] {
  const end = parseISO(endDateStr);
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    out.push(format(subDays(end, i), DATE_FMT));
  }
  return out;
}

/** Days remaining until a target (e.g. Aug 1). Negative if passed. */
export function daysUntil(targetISO: string): number {
  return differenceInCalendarDays(parseISO(targetISO), startOfDay(new Date()));
}

export { parseISO, format };
