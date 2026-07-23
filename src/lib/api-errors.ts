import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

type ConflictMessages = {
  unique?: string;
  notFound?: string;
  fallback?: string;
};

/**
 * A known, expected failure with a specific HTTP status — e.g. a business-rule
 * rejection thrown inside a `prisma.$transaction` callback. Catch with
 * `instanceof ApiError` instead of matching on `error.message` strings.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function handlePrismaError(error: unknown, messages: ConflictMessages = {}) {
  if (error instanceof ApiError) {
    return errorResponse(error.message, error.status);
  }

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
