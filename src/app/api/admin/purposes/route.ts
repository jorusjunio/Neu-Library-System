import { NextResponse } from "next/server";
import { errorResponse, handlePrismaError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

export async function POST(request: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    const purpose = await prisma.purpose.create({
      data: {
        name,
        sortOrder,
        active: body?.active !== false,
      },
    });

    return NextResponse.json({ purpose }, { status: 201 });
  } catch (error) {
    return handlePrismaError(error, {
      unique: "Purpose name already exists.",
      fallback: "Could not create purpose.",
    });
  }
}
