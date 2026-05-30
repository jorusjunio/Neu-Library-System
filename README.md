# NEU Library System

Next.js + TypeScript visitor management system for the NEU Library.

The app uses Prisma 7, PostgreSQL/Neon, and NextAuth credentials login. Visitors can check in from the entrance screen, while admins manage visitors, purposes, logs, and dashboard reports.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in:

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require"
   NEXTAUTH_SECRET="replace-this-with-a-long-random-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. Generate Prisma client and run migrations:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. Seed demo data:

   ```bash
   npm run db:seed
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

## Test Accounts

Admin:

- Username: `admin`
- Password: `admin123`

Visitors:

- School ID: `2021-00001`, Email: `juan@neu.edu.ph`
- School ID: `2021-00002`, Email: `maria@neu.edu.ph`
- School ID: `FAC-0001`, Email: `roberto.cruz@neu.edu.ph`
- School ID: `EMP-0001`, Email: `ligaya.flores@neu.edu.ph`

Change the seeded admin password before deployment.

## Scripts

- `npm run dev` - start local development server
- `npm run build` - production build
- `npm run lint` - run ESLint
- `npm run test` - run Node tests
- `npm run db:generate` - generate Prisma client
- `npm run db:migrate` - run development migrations
- `npm run db:seed` - seed demo data
- `npm run db:studio` - open Prisma Studio
