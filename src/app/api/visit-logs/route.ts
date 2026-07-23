import { NextResponse } from "next/server";
import { ApiError, errorResponse, handlePrismaError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { getNextVisitStreak } from "@/lib/visit-streak";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const visitorId = body?.visitorId;
  const purposeId = body?.purposeId;
  const purposeName = body?.purposeName?.trim();

  if (!visitorId || (!purposeId && !purposeName)) {
    return errorResponse("visitorId and purpose are required.", 400);
  }

  const now = new Date();

  try {
    const visitLog = await prisma.$transaction(async (tx) => {
      const visitor = await tx.visitor.findUnique({
        where: { id: visitorId },
      });

      if (!visitor) {
        throw new ApiError("Visitor was not found.", 404);
      }

      if (visitor.blocked) {
        throw new ApiError("This visitor account is blocked.", 403);
      }

      const purpose = purposeId
        ? await tx.purpose.findFirst({ where: { id: purposeId, active: true } })
        : await tx.purpose.findFirst({ where: { name: purposeName, active: true } });

      if (!purpose) {
        throw new ApiError("Selected purpose is inactive or unavailable.", 400);
      }

      const nextStreak = getNextVisitStreak(visitor.lastVisitAt, visitor.currentStreak, now);

      await tx.visitor.update({
        where: { id: visitor.id },
        data: {
          totalVisits: { increment: 1 },
          currentStreak: nextStreak,
          longestStreak: Math.max(visitor.longestStreak, nextStreak),
          lastVisitAt: now,
        },
      });

      return tx.visitLog.create({
        data: {
          visitorId: visitor.id,
          purposeId: purpose.id,
          purposeSnapshot: purpose.name,
          schoolId: visitor.schoolId,
          visitorName: visitor.name,
          college: visitor.college,
          type: visitor.type,
          visitedAt: now,
        },
      });
    });

    return NextResponse.json({ visitLog }, { status: 201 });
  } catch (error) {
    return handlePrismaError(error, { fallback: "Visit could not be logged." });
  }
}
