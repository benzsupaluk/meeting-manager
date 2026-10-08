import { format, isSameDay } from "date-fns";

/** "Oct 12, 2025 · 10:00 AM – 11:00 AM" (end date shown only when it differs). */
export function formatMeetingRange(startAt: string, endAt: string): string {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const endLabel = isSameDay(start, end) ? format(end, "h:mm a") : format(end, "MMM d, yyyy h:mm a");
  return `${format(start, "MMM d, yyyy")} · ${format(start, "h:mm a")} – ${endLabel}`;
}

export const formatTime = (iso: string) => format(new Date(iso), "h:mm a");

export const formatDate = (iso: string) => format(new Date(iso), "MMM d, yyyy");

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/** Combines a calendar date with an "HH:mm" time (local timezone) into an ISO string. */
export function combineDateAndTime(date: Date, time: string): string {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result.toISOString();
}

export const toTimeInput = (iso: string) => format(new Date(iso), "HH:mm");

export const isOnline = (type: string) => type !== "onsite";
