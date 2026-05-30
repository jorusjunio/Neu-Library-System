import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

type ConflictMessages = {
  unique?: string;
  notFound?: string;
  fallback?: string;
};

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function handlePrismaError(error: unknown, messages: ConflictMessages = {}) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return errorResponse(messages.unique ?? "A record with the same unique value already exists.", 409);
    }

    if (error.code === "P2025") {
      return errorResponse(messages.notFound ?? "Record was not found.", 404);
    }
  }

  console.error(error);
  return errorResponse(messages.fallback ?? "Request could not be completed.", 500);
}
