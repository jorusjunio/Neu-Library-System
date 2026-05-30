import { NextResponse } from "next/server";
import { errorResponse, handlePrismaError } from "@/lib/api-errors";
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
        throw new Error("VISITOR_NOT_FOUND");
      }

      if (visitor.blocked) {
        throw new Error("VISITOR_BLOCKED");
      }

      const purpose = purposeId
        ? await tx.purpose.findFirst({ where: { id: purposeId, active: true } })
        : await tx.purpose.findFirst({ where: { name: purposeName, active: true } });

      if (!purpose) {
        throw new Error("PURPOSE_NOT_FOUND");
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
    if (error instanceof Error) {
      if (error.message === "VISITOR_NOT_FOUND") {
        return errorResponse("Visitor was not found.", 404);
      }

      if (error.message === "VISITOR_BLOCKED") {
        return errorResponse("This visitor account is blocked.", 403);
      }

      if (error.message === "PURPOSE_NOT_FOUND") {
        return errorResponse("Selected purpose is inactive or unavailable.", 400);
      }
    }

    return handlePrismaError(error, { fallback: "Visit could not be logged." });
  }
}
