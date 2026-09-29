// Creates a development account with sample books.
// Run with `npm run db:seed`. Safe to run repeatedly: it deletes and
// recreates the dev account (and, via cascade, its books and sessions).
//
// Development-only sign-in:
//   email:    dev@example.com
//   password: dev-password-123
import "dotenv/config";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const DEV_ACCOUNT = {
  name: "Dev Reader",
  email: "dev@example.com",
  password: "dev-password-123",
};

async function main() {
  await db.user.deleteMany({ where: { email: DEV_ACCOUNT.email } });

  // Sign up through Better Auth so the password is hashed exactly as it would
  // be for a real user.
  const { user } = await auth.api.signUpEmail({ body: DEV_ACCOUNT });
  // Sign-up also signs in, creating a session no browser will ever use.
  await db.session.deleteMany({ where: { userId: user.id } });

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

  console.log(`Seeded ${user.email} with 4 books.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
