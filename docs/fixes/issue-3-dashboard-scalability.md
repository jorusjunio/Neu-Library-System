# Issue 3 Fix: Dashboard endpoint may become slow with larger data

**Status:** Fixed
**Related:** [codebase-issues.md](../codebase-issues.md) — Issue 3

## Original problem

`GET /api/admin/dashboard` loaded a large amount of data on every request:

- `prisma.visitor.findMany()` with **no limit at all** — every visitor ever recorded,
  unbounded, growing forever as the roster grows.
- `prisma.visitLog.findMany({ take: 1000 })` — the 1000 most recent logs.
- Two `.count()` queries for totals.
- Four `Array.reduce()` passes over those 1000 logs in Node to bucket them by
  purpose, college, day, and hour (plus Manila-timezone formatting per row) to
  build `stats` and `charts` in the response.

## What investigation found

Before optimizing the aggregation, I checked whether the frontend actually used the
server-computed `stats` and `charts` fields. It doesn't:

```
grep "dashboard.charts|dashboard.stats|logLimit" src/app/admin/**
→ no matches (outside the type definition)
```

`src/app/admin/page.tsx` recomputes `overviewStats` and `overviewCharts` entirely
client-side from `visitLogs`, because the Overview tab's Purpose/College/Visitor/Date
filters need to react live without a refetch — a static server-computed snapshot can't
serve that. So the API was doing four reduce passes and Manila-timezone formatting
over up to 1000 rows, plus two `.count()` queries, on **every** dashboard load, to
produce a `stats`/`charts`/`logLimit` payload that was silently discarded by the
client every single time.

## Fix

`src/app/api/admin/dashboard/route.ts`:
- Removed the dead `stats`, `charts`, and `logLimit` computation entirely — the Manila
  day/hour helper functions, the four `reduce()` aggregations, and the two `.count()`
  queries that only fed them. The route now returns exactly what the client reads:
  `visitors`, `visitLogs`, `purposes`, `admins`.
- Capped `prisma.visitor.findMany()` with `take: VISITOR_LIMIT` (1000), matching the
  bounding pattern already used for `visitLogs` (`RECENT_LOG_LIMIT`). This was the one
  genuinely unbounded query — the visitor roster only grows over time, with nothing
  previously stopping it from being fetched in full on every dashboard load.

`src/app/admin/types.ts`:
- Removed `stats` and `charts` from the `DashboardData` type to match the trimmed
  response shape. `CountRow` stays — it's still used internally by the chart
  components, just no longer part of the dashboard API contract.

## Why this is the right scope

A "make it scale" fix could have meant pushing the aggregation into `groupBy` queries
or building full server-side pagination for the Visitors/Logs tables. I didn't do
either: the aggregation was dead code (no amount of optimizing unused computation
helps), and full pagination would mean rebuilding the client-side search/filter/export
behavior across three tabs that this session already built and tested extensively —
a much larger, riskier change than what Issue 3 asked for. Capping the one unbounded
query plus deleting the wasted computation directly addresses "loads many records...
which can become inefficient as the dataset grows" without destabilizing working UI.

## Verification

- `tsc --noEmit` and `next build` — clean.
- Live Playwright run against the real dev database: captured the actual
  `/api/admin/dashboard` response and confirmed its keys are now exactly
  `["visitors", "visitLogs", "purposes", "admins"]`.
- Confirmed the Overview tab still renders correctly — stat cards and all four charts
  compute their values identically, since they were already client-derived from
  `visitLogs` and never touched the removed fields. Zero console errors.

## Follow-up (not done here — out of scope for this fix)

If the visitor roster or log volume eventually exceeds these caps in practice, the
next step is server-side pagination/search for the Visitors and Logs tables instead of
raising the limits further. That's a frontend architecture change (query params,
per-filter refetch, loading states) and should be its own piece of work, not bundled
into this fix.
