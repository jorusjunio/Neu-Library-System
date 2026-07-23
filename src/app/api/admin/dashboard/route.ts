import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

const RECENT_LOG_LIMIT = 1000;
const VISITOR_LIMIT = 1000;

export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [visitors, visitLogs, purposes, admins] = await Promise.all([
    prisma.visitor.findMany({
      orderBy: { name: "asc" },
      take: VISITOR_LIMIT,
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
  ]);

  return NextResponse.json({
    visitors,
    visitLogs,
    purposes,
    admins,
  });
}
