# Codebase Issues Review

## Overview
This document summarizes the main issues found in the current codebase after reviewing the auth, API, and data layers.

## Issues

### Issue 1: Admin authorization is not role-validated
The admin API routes only check whether a session exists, but they do not explicitly verify that the authenticated user has the ADMIN role.

Affected files:
- [src/app/api/admin/users/route.ts](src/app/api/admin/users/route.ts)
- [src/app/api/admin/visitors/route.ts](src/app/api/admin/visitors/route.ts)
- [src/app/api/admin/purposes/route.ts](src/app/api/admin/purposes/route.ts)
- [src/app/api/admin/dashboard/route.ts](src/app/api/admin/dashboard/route.ts)

### Issue 2: Auth role data is present but not enforced
The authentication configuration includes a role value in [src/lib/auth.ts](src/lib/auth.ts), but the admin routes are not using that role to enforce access control.

### Issue 3: Dashboard endpoint may become slow with larger data
The dashboard API loads many records at once, including a large number of visit logs and visitors, which can become inefficient as the dataset grows.

Affected file:
- [src/app/api/admin/dashboard/route.ts](src/app/api/admin/dashboard/route.ts)

### Issue 4: Error handling is somewhat brittle
Some API routes rely on string-based error checks for flow control, which is harder to maintain and less robust than a typed approach.

Affected file:
- [src/app/api/visit-logs/route.ts](src/app/api/visit-logs/route.ts)

### Issue 5: Environment dependency can cause startup failures
The Prisma client and configuration depend on the database environment variables being available. Missing configuration can cause startup or migration issues in a new environment.

Affected files:
- [src/lib/prisma.ts](src/lib/prisma.ts)
- [prisma.config.ts](prisma.config.ts)

## Summary
The project is functional and builds successfully, but the main concerns are around access control, scalability, and maintainability.
