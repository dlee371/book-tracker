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
      {
        userId: user.id,
        title: "Dune",
        author: "Frank Herbert",
        genre: "Science Fiction",
        publicationYear: 1965,
        pageCount: 412,
        status: "COMPLETED",
        startedAt: new Date("2026-03-10"),
        finishedAt: new Date("2026-03-28"),
        rating: 4,
      },
      {
        userId: user.id,
        title: "Man's Search for Meaning",
        author: "Viktor E. Frankl",
        genre: "Psychology",
        publicationYear: 1946,
        pageCount: 165,
        status: "COMPLETED",
        startedAt: new Date("2025-12-01"),
        finishedAt: new Date("2025-12-06"),
        rating: 5,
      },
      {
        userId: user.id,
        title: "Influence",
        author: "Robert B. Cialdini",
        genre: "Psychology",
        publicationYear: 1984,
        pageCount: 336,
        status: "READING",
        startedAt: new Date("2026-09-15"),
      },
      {
        userId: user.id,
        title: "The Pragmatic Programmer",
        author: "David Thomas & Andrew Hunt",
        genre: "Software",
        publicationYear: 1999,
        pageCount: 352,
        status: "WANT_TO_READ",
      },
    ],
  });

  console.log(`Seeded ${user.email} with sample books.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
