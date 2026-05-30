import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";
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
  const username = body?.username?.trim();
  const name = body?.name?.trim();
  const email = body?.email?.trim().toLowerCase() || null;
  const password = body?.password?.trim();

  if (!username || !name) {
    return errorResponse("username and name are required.", 400);
  }

  if (password && password.length < 8) {
    return errorResponse("Password must be at least 8 characters.", 400);
  }

  try {
    const currentUser = await prisma.user.findUnique({ where: { id }, select: { active: true } });
    const activeAdmins = await prisma.user.count({ where: { active: true } });

    if (currentUser?.active && body?.active === false && activeAdmins <= 1) {
      return errorResponse("At least one active admin account is required.", 400);
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        username,
        email,
        name,
        active: body?.active !== false,
        ...(password ? { passwordHash: await hash(password, 12) } : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return handlePrismaError(error, {
      unique: "Username or email is already used by another admin.",
      notFound: "Admin account was not found.",
      fallback: "Could not update admin account.",
    });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const activeAdmins = await prisma.user.count({ where: { active: true } });
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return errorResponse("Admin account was not found.", 404);
    }

    if (user.active && activeAdmins <= 1) {
      return errorResponse("At least one active admin account is required.", 400);
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handlePrismaError(error, {
      notFound: "Admin account was not found.",
      fallback: "Could not delete admin account.",
    });
  }
}
