import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";
import { errorResponse, handlePrismaError } from "@/lib/api-errors";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return Boolean(session?.user);
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const username = body?.username?.trim();
  const password = body?.password;
  const name = body?.name?.trim();
  const email = body?.email?.trim().toLowerCase() || null;

  if (!username || !password || !name) {
    return errorResponse("username, name, and password are required.", 400);
  }

  if (password.length < 8) {
    return errorResponse("Password must be at least 8 characters.", 400);
  }

  try {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        name,
        passwordHash: await hash(password, 12),
        active: body?.active !== false,
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

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return handlePrismaError(error, {
      unique: "Username or email is already used by another admin.",
      fallback: "Could not create admin account.",
    });
  }
}
