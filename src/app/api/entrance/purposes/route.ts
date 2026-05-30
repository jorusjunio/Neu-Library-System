import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const purposes = await prisma.purpose.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
    },
  });

  return NextResponse.json({ purposes });
}
