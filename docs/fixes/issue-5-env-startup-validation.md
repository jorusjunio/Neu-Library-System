# Issue 5 Fix: Environment dependency can cause startup failures

**Status:** Fixed
**Related:** [codebase-issues.md](../codebase-issues.md) — Issue 5

## Original problem

Both the app's Prisma client and the Prisma CLI config passed `process.env.DATABASE_URL`
straight through without checking it existed first:

```ts
// src/lib/prisma.ts
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL, // undefined if unset
});
```

```ts
// prisma.config.ts
datasource: {
  url: process.env["DATABASE_URL"], // undefined if unset
},
```

If a new environment (fresh clone, new deploy target, CI) doesn't have `DATABASE_URL`
set, neither file fails at the obvious place. Instead, `undefined` gets handed to the
`pg` connection pool or the Prisma CLI's config loader, which then fail later with a
low-level driver/parsing error that doesn't mention the actual missing variable —
exactly the "unclear startup/migration failure" the issue describes.

`.env.example` already documents `DATABASE_URL` as required, but nothing enforces
that a `.env` actually exists or is filled in.

## Fix

Added an explicit guard in both files, before the value is used, so the failure
happens at the obvious spot with a message that says what's wrong and how to fix it:

```ts
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and fill in your database connection string before starting the app.",
  );
}
```

(`prisma.config.ts` gets the same guard with a CLI-flavored message: "...before running
Prisma commands.")

## Why not a shared helper

`prisma.config.ts` is loaded by the Prisma CLI directly (`prisma migrate`, `prisma
generate`, `prisma studio`), outside of Next.js's module resolution — importing a
`@/lib/...`-aliased helper from it isn't guaranteed to resolve the same way there as
it does inside the app. Duplicating six lines of guard logic across two files is a
smaller risk than introducing a cross-context import that could break `npm run
db:migrate` for reasons unrelated to the actual fix.

## Verification

Confirmed both the working path and the failure path, not just the happy path:

- `next build` with the real `.env` present — unaffected, builds clean.
- `DATABASE_URL= npx prisma validate` (empty override on the command line, real
  `.env` untouched — dotenv doesn't override an already-set key) →
  ```
  Error: DATABASE_URL is not set. Copy .env.example to .env and fill in your
  database connection string before running Prisma commands.
  ```
- Imported `src/lib/prisma.ts` directly via `tsx` with `DATABASE_URL` cleared in an
  isolated process → threw the matching app-side message instead of a `pg` driver
  error.

Both now fail immediately with an actionable message instead of a confusing error
several layers down.
