import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const RECENT_LOG_LIMIT = 1000;

function getManilaDayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Manila",
  }).format(date);
}

function getManilaDayLabel(date: Date) {
  return DAY_LABELS[
    Number(
      new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        timeZone: "Asia/Manila",
      })
        .format(date)
        .replace("Sun", "0")
        .replace("Mon", "1")
        .replace("Tue", "2")
        .replace("Wed", "3")
        .replace("Thu", "4")
        .replace("Fri", "5")
        .replace("Sat", "6"),
    )
  ];
}

function getManilaHour(date: Date) {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Manila",
    }).format(date),
  );
}

function toCountRows(counts: Record<string, number>) {
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [visitors, visitLogs, purposes, admins, totalVisits, uniqueVisitors] = await Promise.all([
    prisma.visitor.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.visitLog.findMany({
      orderBy: { visitedAt: "desc" },
      take: RECENT_LOG_LIMIT,
    }),
    prisma.purpose.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        active: true,
        createdAt: true,
      },
    }),
    prisma.visitLog.count(),
    prisma.visitor.count(),
  ]);

  const purposeCounts = visitLogs.reduce<Record<string, number>>((acc, log) => {
    acc[log.purposeSnapshot] = (acc[log.purposeSnapshot] ?? 0) + 1;
    return acc;
  }, {});

  const collegeCounts = visitLogs.reduce<Record<string, number>>((acc, log) => {
    acc[log.college] = (acc[log.college] ?? 0) + 1;
    return acc;
  }, {});

  const dayCounts = visitLogs.reduce<Record<string, { label: string; count: number }>>((acc, log) => {
    const key = getManilaDayKey(log.visitedAt);
    acc[key] = acc[key] ?? { label: getManilaDayLabel(log.visitedAt), count: 0 };
    acc[key].count += 1;
    return acc;
  }, {});

  const hourlyCounts = visitLogs.reduce<Record<string, number>>((acc, log) => {
    const hour = getManilaHour(log.visitedAt);
    const label = `${hour.toString().padStart(2, "0")}:00`;
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});

  const topPurpose =
    Object.entries(purposeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  const topCollege =
    Object.entries(collegeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

  return NextResponse.json({
    stats: {
      totalVisits,
      uniqueVisitors,
      topPurpose,
      topCollege,
    },
    visitors,
    visitLogs,
    logLimit: RECENT_LOG_LIMIT,
    purposes,
    admins,
    charts: {
      visitsPerDay: Object.entries(dayCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-7)
        .map(([, value]) => value),
      purposeBreakdown: toCountRows(purposeCounts),
      visitsByHour: toCountRows(hourlyCounts).sort((a, b) => a.label.localeCompare(b.label)),
      topColleges: toCountRows(collegeCounts).slice(0, 6),
    },
  });
}
