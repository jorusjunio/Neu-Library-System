import { chartColors } from "../config";
import type { CountRow, DateRangeFilter, VisitLog } from "../types";

export function displayType(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

export function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

export function includesQuery(values: Array<string | number | null | undefined>, query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) return true;

  return values.some((value) => String(value ?? "").toLowerCase().includes(normalized));
}

export function dateKey(value: Date) {
  return value.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

export function inDateRange(value: string, range: DateRangeFilter) {
  if (range === "all") return true;

  const date = new Date(value);
  const now = new Date();

  if (range === "today") {
    return dateKey(date) === dateKey(now);
  }

  if (range === "month") {
    return (
      date.toLocaleDateString("en-CA", { month: "2-digit", timeZone: "Asia/Manila" }) ===
        now.toLocaleDateString("en-CA", { month: "2-digit", timeZone: "Asia/Manila" }) &&
      date.toLocaleDateString("en-CA", { year: "numeric", timeZone: "Asia/Manila" }) ===
        now.toLocaleDateString("en-CA", { year: "numeric", timeZone: "Asia/Manila" })
    );
  }

  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  return date >= start && date <= now;
}

export function countBy(rows: VisitLog[], getLabel: (row: VisitLog) => string) {
  const map = new Map<string, number>();

  rows.forEach((row) => {
    const label = getLabel(row) || "Unknown";
    map.set(label, (map.get(label) ?? 0) + 1);
  });

  return Array.from(map, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

export function visitsPerDay(rows: VisitLog[]) {
  return countBy(rows, (row) => dateKey(new Date(row.visitedAt)))
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(-7);
}

export function visitsByHour(rows: VisitLog[]) {
  return countBy(rows, (row) =>
    new Intl.DateTimeFormat("en-PH", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Manila",
    }).format(new Date(row.visitedAt)),
  ).sort((a, b) => a.label.localeCompare(b.label));
}

export function maxCount(rows: CountRow[]) {
  return Math.max(1, ...rows.map((row) => row.count));
}

export function pieBackground(rows: CountRow[]) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  if (!total) {
    return "rgba(255,255,255,0.06)";
  }

  let cursor = 0;
  const slices = rows.map((row, index) => {
    const start = cursor;
    const size = (row.count / total) * 100;
    cursor += size;
    return `${chartColors[index % chartColors.length]} ${start}% ${cursor}%`;
  });

  return `conic-gradient(${slices.join(", ")})`;
}
