// Fills the local database with a development user and sample books.
// Run with `npx prisma db seed`. Safe to run repeatedly: it resets the dev
// user's books each time.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { DEV_USER_EMAIL } from "../lib/dev-user";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const user = await db.user.upsert({
    where: { email: DEV_USER_EMAIL },
    update: {},
    create: { email: DEV_USER_EMAIL, name: "Dev Reader" },
  });

  await db.book.deleteMany({ where: { userId: user.id } });

  await db.book.createMany({
    data: [
      {
        userId: user.id,
        title: "Atomic Habits",
        author: "James Clear",
        genre: "Psychology",
        publicationYear: 2018,
        pageCount: 320,
        status: "COMPLETED",
        startedAt: new Date("2026-01-04"),
        finishedAt: new Date("2026-01-20"),
        rating: 5,
        review: "Practical and memorable. The environment chapter stuck with me.",
      },
      {
        userId: user.id,
        title: "Thinking, Fast and Slow",
        author: "Daniel Kahneman",
        genre: "Psychology",
        publicationYear: 2011,
        pageCount: 499,
        status: "READING",
        startedAt: new Date("2026-09-01"),
      },
      {
        userId: user.id,
        title: "Deep Work",
        author: "Cal Newport",
        genre: "Productivity",
        publicationYear: 2016,
        pageCount: 296,
        status: "WANT_TO_READ",
      },
      {
        userId: user.id,
        title: "Sapiens",
        author: "Yuval Noah Harari",
        genre: "History",
        publicationYear: 2011,
        pageCount: 443,
        status: "ABANDONED",
        startedAt: new Date("2025-11-10"),
      },
    ],
  });

  console.log(`Seeded dev user ${user.email} with 4 books.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
