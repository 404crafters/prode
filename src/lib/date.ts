import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

export function getArgentinaDateKey(date: Date): string {
  return formatInTimeZone(date, ARGENTINA_TIME_ZONE, "yyyy-MM-dd");
}

export function getStartOfArgentinaDayFor(date: Date): Date {
  const dateKey = getArgentinaDateKey(date);
  return fromZonedTime(`${dateKey}T00:00:00`, ARGENTINA_TIME_ZONE);
}

export function formatArgentinaDateTime(date: Date): string {
  return formatInTimeZone(date, ARGENTINA_TIME_ZONE, "dd/MM/yyyy HH:mm");
}
