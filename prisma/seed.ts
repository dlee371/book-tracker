// Creates a development account with sample books.
// Run with `npm run db:seed`. Safe to run repeatedly: it deletes and
// recreates the dev account (and, via cascade, its books and sessions).
//
// Development-only sign-in:
//   email:    dev@example.com
//   password: dev-password-123
import "dotenv/config";

import { auth } from "@/lib/auth";
import { authorSortKey } from "@/lib/author-sort";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

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

  // `satisfies` checks each book against the Prisma type while keeping exact
  // values like status: "COMPLETED" (instead of widening them to string).
  const books = [
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
  ] satisfies Omit<Prisma.BookCreateManyInput, "authorSort">[];

  await db.book.createMany({
    data: books.map((book) => ({
      ...book,
      authorSort: authorSortKey(book.author),
    })),
  });

  const bookId = async (title: string) =>
    (await db.book.findFirstOrThrow({ where: { userId: user.id, title } })).id;

  const notes = [
    {
      bookId: await bookId("Atomic Habits"),
      page: 83,
      title: "Make it obvious",
      body: "Small environmental changes can make desired behaviors easier.\n\n> Environment is the invisible hand that shapes human behavior.",
      tags: ["environment", "behavior", "habits"],
    },
    {
      bookId: await bookId("Atomic Habits"),
      page: 27,
      body: "Habits are the **compound interest** of self-improvement:\n\n- 1% better every day adds up\n- 1% worse every day adds up too",
      tags: ["habits"],
    },
    {
      bookId: await bookId("Atomic Habits"),
      body: "Idea to try: put the book I'm reading on my pillow each morning.",
      tags: [],
    },
    {
      bookId: await bookId("Thinking, Fast and Slow"),
      page: 20,
      title: "Two systems",
      body: "System 1 is fast and automatic; System 2 is slow and effortful. Most of our choices are made by System 1.",
      tags: ["decision making", "behavior"],
    },
    {
      bookId: await bookId("Influence"),
      page: 12,
      body: "*Click, whirr*: shortcuts that usually serve us well can be exploited.",
      tags: ["decision making", "persuasion"],
    },
  ];

  for (const { tags, ...note } of notes) {
    await db.note.create({
      data: {
        ...note,
        userId: user.id,
        // Use each tag if it exists, otherwise create it.
        tags: {
          create: tags.map((name) => ({
            tag: {
              connectOrCreate: {
                where: { userId_name: { userId: user.id, name } },
                create: { userId: user.id, name },
              },
            },
          })),
        },
      },
    });
  }

  console.log(`Seeded ${user.email} with sample books.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
