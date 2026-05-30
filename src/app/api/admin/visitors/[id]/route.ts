import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { VisitorType } from "@/generated/prisma/enums";
import { errorResponse, handlePrismaError } from "@/lib/api-errors";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
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
    const visitor = await prisma.visitor.update({
      where: { id },
      data: {
        schoolId,
        email,
        name,
        college,
        type,
        blocked: Boolean(body?.blocked),
      },
    });

    return NextResponse.json({ visitor });
  } catch (error) {
    return handlePrismaError(error, {
      unique: "School ID or email is already used by another visitor.",
      notFound: "Visitor was not found.",
      fallback: "Could not update visitor.",
    });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await prisma.visitor.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handlePrismaError(error, {
      notFound: "Visitor was not found.",
      fallback: "Could not delete visitor.",
    });
  }
}
