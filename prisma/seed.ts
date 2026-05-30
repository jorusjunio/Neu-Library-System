import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const purposes = [
  "Reading Books",
  "Thesis Research",
  "Use of Computer",
  "Doing Assignments",
];

const visitors = [
  {
    schoolId: "2021-00001",
    email: "juan@neu.edu.ph",
    name: "Juan dela Cruz",
    college: "College of Computer Studies",
    type: "STUDENT" as const,
    totalVisits: 12,
    currentStreak: 4,
    longestStreak: 6,
    lastVisitAt: new Date("2026-05-24T00:00:00.000Z"),
  },
  {
    schoolId: "2021-00002",
    email: "maria@neu.edu.ph",
    name: "Maria Santos",
    college: "College of Nursing",
    type: "STUDENT" as const,
    totalVisits: 8,
    currentStreak: 2,
    longestStreak: 3,
    lastVisitAt: new Date("2026-05-23T00:00:00.000Z"),
  },
  {
    schoolId: "FAC-0001",
    email: "roberto.cruz@neu.edu.ph",
    name: "Prof. Roberto Cruz",
    college: "College of Computer Studies",
    type: "FACULTY" as const,
    totalVisits: 21,
    currentStreak: 7,
    longestStreak: 9,
    lastVisitAt: new Date("2026-05-25T00:00:00.000Z"),
  },
  {
    schoolId: "EMP-0001",
    email: "ligaya.flores@neu.edu.ph",
    name: "Ms. Ligaya Flores",
    college: "Library Office",
    type: "EMPLOYEE" as const,
    totalVisits: 4,
    currentStreak: 1,
    longestStreak: 2,
    lastVisitAt: new Date("2026-05-20T00:00:00.000Z"),
  },
];

async function main() {
  await prisma.visitLog.deleteMany();

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@neu.edu.ph",
      name: "Library Administrator",
      passwordHash: await hash("admin123", 12),
    },
  });

  const seededPurposes = [];

  for (const [index, name] of purposes.entries()) {
    const purpose = await prisma.purpose.upsert({
      where: { name },
      update: { sortOrder: index },
      create: { name, sortOrder: index },
    });

    seededPurposes.push(purpose);
  }

  for (const [visitorIndex, visitor] of visitors.entries()) {
    const savedVisitor = await prisma.visitor.upsert({
      where: { schoolId: visitor.schoolId },
      update: visitor,
      create: visitor,
    });

    for (let index = 0; index < visitor.totalVisits; index++) {
      const purpose = seededPurposes[(index + visitorIndex) % seededPurposes.length];
      const visitedAt = new Date("2026-05-20T00:00:00.000Z");
      visitedAt.setUTCDate(visitedAt.getUTCDate() + (index % 7));
      visitedAt.setUTCHours(0 + ((index + visitorIndex * 2) % 10), (index * 7) % 60, 0, 0);

      await prisma.visitLog.create({
        data: {
          visitorId: savedVisitor.id,
          purposeId: purpose.id,
          purposeSnapshot: purpose.name,
          schoolId: savedVisitor.schoolId,
          visitorName: savedVisitor.name,
          college: savedVisitor.college,
          type: savedVisitor.type,
          visitedAt,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
