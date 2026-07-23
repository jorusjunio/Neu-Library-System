# Issue 4 Fix: Error handling is somewhat brittle

**Status:** Fixed
**Related:** [codebase-issues.md](../codebase-issues.md) — Issue 4

## Original problem

`src/app/api/visit-logs/route.ts` used raw `Error` objects with magic-string messages
to signal specific business-rule failures out of a `prisma.$transaction` callback, then
matched on those exact strings in the `catch` block to pick an HTTP status:

```ts
if (!visitor) {
  throw new Error("VISITOR_NOT_FOUND");
}
...
if (error.message === "VISITOR_NOT_FOUND") {
  return errorResponse("Visitor was not found.", 404);
}
```

This has no compiler safety net: a typo in either the `throw` string or the `catch`
comparison silently falls through to the generic 500 fallback instead of failing to
build. The user-facing message and status also live far from the throw site, in a
separate if-chain that has to be kept in sync by hand.

## Fix

Added `ApiError` to `src/lib/api-errors.ts` — a typed error carrying its own HTTP
status:

```ts
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
```

`handlePrismaError()` now checks `instanceof ApiError` first, before the existing
Prisma-specific checks, so any route funneling its catch block through
`handlePrismaError` gets `ApiError` handling for free.

In `visit-logs/route.ts`, each business-rule rejection now throws `ApiError` directly
with its real message and status at the point of failure:

```ts
if (!visitor) {
  throw new ApiError("Visitor was not found.", 404);
}

if (visitor.blocked) {
  throw new ApiError("This visitor account is blocked.", 403);
}
...
if (!purpose) {
  throw new ApiError("Selected purpose is inactive or unavailable.", 400);
}
```

The catch block collapsed from a 15-line string-matching if-chain to one line, since
`handlePrismaError` now resolves `ApiError` on its own:

```ts
} catch (error) {
  return handlePrismaError(error, { fallback: "Visit could not be logged." });
}
```

## Why this is more robust than the string-matching version

- `instanceof ApiError` can't typo the way a duplicated string literal can — if the
  class name or import is wrong, it's a compile error, not a silently-wrong status code.
- Message and status live together at the throw site, not split across a throw and a
  matching branch in a separate catch block.
- New failure cases anywhere in the codebase get correct handling automatically via
  `handlePrismaError`, without adding another `if (error.message === ...)` branch.

## Verification

- `tsc --noEmit` and `next build` — clean.
- Exercised all four response paths directly against the running route (not just
  reading the code):
  - Missing `visitorId`/purpose → `400` "visitorId and purpose are required."
  - Unknown `visitorId` → `404` "Visitor was not found."
  - Real visitor temporarily blocked via the admin UI → `403` "This visitor account is
    blocked." — then unblocked again to restore state.
  - Nonexistent purpose name → `400` "Selected purpose is inactive or unavailable."
  - All four matched the pre-refactor behavior exactly, confirming no regression.
