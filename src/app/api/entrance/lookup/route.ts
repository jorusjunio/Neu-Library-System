import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function formatVisitor(visitor: {
  id: string;
  schoolId: string;
  email: string;
  name: string;
  college: string;
  type: string;
  totalVisits: number;
  currentStreak: number;
  longestStreak: number;
  lastVisitAt: Date | null;
  blocked: boolean;
}) {
  return {
    id: visitor.id,
    schoolId: visitor.schoolId,
    email: visitor.email,
    name: visitor.name,
    college: visitor.college,
    type: visitor.type,
    totalVisits: visitor.totalVisits,
    currentStreak: visitor.currentStreak,
    longestStreak: visitor.longestStreak,
    lastVisit: visitor.lastVisitAt?.toISOString() ?? null,
    blocked: visitor.blocked,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input")?.trim();

  if (!input) {
    return NextResponse.json(
      { error: "School ID or email is required." },
      { status: 400 },
    );
  }

  const visitor = await prisma.visitor.findFirst({
    where: {
      OR: [
        { schoolId: input },
        { email: input.toLowerCase() },
      ],
    },
  });

  if (!visitor) {
    return NextResponse.json({ visitor: null }, { status: 404 });
  }

  return NextResponse.json({ visitor: formatVisitor(visitor) });
}
