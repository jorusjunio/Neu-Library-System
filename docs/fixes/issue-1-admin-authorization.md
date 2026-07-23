# Issue 1 Fix: Admin authorization is not role-validated

**Status:** Fixed
**Related:** [codebase-issues.md](../codebase-issues.md) — Issue 1, Issue 2 (same root cause)

## Original problem

Every admin API route defined a function literally named `requireAdmin()`, but its
implementation only checked that a session existed — it never read the `role` field:

```ts
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return Boolean(session?.user);
}
```

This function (or an inline equivalent) was duplicated across seven files. The `role`
value was already present on the session/JWT (set in `src/lib/auth.ts`), which is what
Issue 2 flagged — the data existed but nothing enforced it.

Affected routes:
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/users/[id]/route.ts`
- `src/app/api/admin/visitors/route.ts`
- `src/app/api/admin/visitors/[id]/route.ts`
- `src/app/api/admin/purposes/route.ts`
- `src/app/api/admin/purposes/[id]/route.ts`
- `src/app/api/admin/dashboard/route.ts` (inline check, no shared helper at all)

## Root cause

Session existence and role membership were treated as the same check. Any authenticated
user — regardless of role — passed. Because six of the seven routes each defined their
own copy of the same broken helper, a future fix applied to one copy would not
necessarily reach the other five.

## Fix

Added a single shared helper, `src/lib/require-admin.ts`:

```ts
export async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return null;
  }

  return session;
}
```

Replaced all seven local/inline checks with `requireAdminSession()`, removing the six
duplicated `requireAdmin()` definitions and their now-unused `getServerSession`/
`authOptions` imports. Used the generated `UserRole.ADMIN` enum constant (from
`@/generated/prisma/enums`) rather than a raw string literal, matching the existing
`VisitorType` enum-import convention used elsewhere in the API layer.

## Why centralize instead of patching each copy

Six independent copies of the same security check is how this bug happened in the
first place — the role field existed but was never wired in, and no single place made
that omission obvious. One shared helper means one place to audit, and one place to fix
if requirements change (e.g. a future non-admin role).

## Verification

- `tsc --noEmit` — clean.
- `next build` — clean, all routes compile.
- `curl` against `/api/admin/dashboard` with no session cookie → confirmed `401`
  (unchanged behavior for the unauthenticated case).
- Full live login flow via Playwright against the real dev database: logged in as the
  seeded admin user, confirmed the dashboard loads, zero failed `/api/admin/*`
  requests, zero console errors — the fix does not break legitimate admin access.

## Scope note

`UserRole` currently only defines `ADMIN`, so this fix is primarily defense-in-depth
today — every existing account is an admin. It becomes load-bearing the moment a
second role is introduced, which the enum's existence suggests was the intent.
