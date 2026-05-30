import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { VisitorType } from "@/generated/prisma/enums";
import { errorResponse, handlePrismaError } from "@/lib/api-errors";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return Boolean(session?.user);
}

function parseVisitorType(value: unknown) {
  if (value === VisitorType.STUDENT || value === VisitorType.FACULTY || value === VisitorType.EMPLOYEE) {
    return value;
  }

  return null;
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const type = parseVisitorType(body?.type);
  const schoolId = body?.schoolId?.trim();
  const email = body?.email?.trim().toLowerCase();
  const name = body?.name?.trim();
  const college = body?.college?.trim();

  if (!schoolId || !email || !name || !college || !type) {
    return errorResponse("schoolId, email, name, college, and type are required.", 400);
  }

  try {
    const visitor = await prisma.visitor.create({
      data: { schoolId, email, name, college, type },
    });

    return NextResponse.json({ visitor }, { status: 201 });
  } catch (error) {
    return handlePrismaError(error, {
      unique: "School ID or email is already used by another visitor.",
      fallback: "Could not create visitor.",
    });
  }
}
