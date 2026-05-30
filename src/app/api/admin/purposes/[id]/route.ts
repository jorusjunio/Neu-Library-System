import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const name = body?.name?.trim();
  const sortOrder = Number(body?.sortOrder ?? 0);

  if (!name) {
    return errorResponse("Purpose name is required.", 400);
  }

  if (!Number.isFinite(sortOrder)) {
    return errorResponse("Sort order must be a valid number.", 400);
  }

  try {
    const purpose = await prisma.purpose.update({
      where: { id },
      data: {
        name,
        sortOrder,
        active: body?.active !== false,
      },
    });

    return NextResponse.json({ purpose });
  } catch (error) {
    return handlePrismaError(error, {
      unique: "Purpose name already exists.",
      notFound: "Purpose was not found.",
      fallback: "Could not update purpose.",
    });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await prisma.purpose.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handlePrismaError(error, {
      notFound: "Purpose was not found.",
      fallback: "Could not delete purpose.",
    });
  }
}
