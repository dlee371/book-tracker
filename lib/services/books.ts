import "server-only";

import { cache } from "react";

import { authorSortKey } from "@/lib/author-sort";
import { db } from "@/lib/db";
import type { Prisma, ReadingStatus } from "@/lib/generated/prisma/client";
import type { LibraryQuery, LibrarySort } from "@/lib/library-query";
import type { BookInput } from "@/lib/validation/book";

// All book data access goes through these functions. Every query includes
// userId, so a user can only ever read or change their own books.

// Each sort ends with a tiebreaker so books with equal values keep a stable
// order. `nulls: "last"` puts unrated/unfinished books at the bottom.
const ORDER_BY: Record<LibrarySort, Prisma.BookOrderByWithRelationInput[]> = {
  added: [{ createdAt: "desc" }, { title: "asc" }],
  title: [{ title: "asc" }, { author: "asc" }],
  author: [{ authorSort: "asc" }, { title: "asc" }],
  rating: [{ rating: { sort: "desc", nulls: "last" } }, { title: "asc" }],
  finished: [
    { finishedAt: { sort: "desc", nulls: "last" } },
    { title: "asc" },
  ],
};

// Case-insensitive "contains" match on title, author or genre (SQL: ILIKE).
// Fine at personal-library scale; Milestone 8 adds real full-text search.
function searchFilter(q: string): Prisma.BookWhereInput {
  if (!q) return {};
  return {
    OR: [
      { title: { contains: q, mode: "insensitive" } },
      { author: { contains: q, mode: "insensitive" } },
      { genre: { contains: q, mode: "insensitive" } },
    ],
  };
}

export function listBooks(userId: string, query: LibraryQuery) {
  return db.book.findMany({
    where: {
      userId,
      ...searchFilter(query.q),
      ...(query.status && { status: query.status }),
    },
    orderBy: ORDER_BY[query.sort],
  });
}

// Number of books per status (matching the search, if any), for the status
// tabs. One GROUP BY query instead of a count per status.
export async function countBooksByStatus(
  userId: string,
  q: string,
): Promise<Record<ReadingStatus, number>> {
  const groups = await db.book.groupBy({
    by: ["status"],
    where: { userId, ...searchFilter(q) },
    _count: { _all: true },
  });

  const counts: Record<ReadingStatus, number> = {
    WANT_TO_READ: 0,
    READING: 0,
    COMPLETED: 0,
    ABANDONED: 0,
  };
  for (const group of groups) counts[group.status] = group._count._all;
  return counts;
}

// cache() dedupes calls within one request: the book page asks for the book
// in both generateMetadata (the tab title) and the page itself.
export const getBook = cache((userId: string, bookId: string) => {
  return db.book.findFirst({ where: { id: bookId, userId } });
});

export function createBook(userId: string, input: BookInput) {
  return db.book.create({
    data: { ...input, authorSort: authorSortKey(input.author), userId },
  });
}

// updateMany/deleteMany let us filter by userId as well as id. They return how
// many rows matched: 0 means the book doesn't exist or isn't this user's.
export async function updateBook(
  userId: string,
  bookId: string,
  input: BookInput,
): Promise<boolean> {
  const { count } = await db.book.updateMany({
    where: { id: bookId, userId },
    data: { ...input, authorSort: authorSortKey(input.author) },
  });
  return count > 0;
}

export async function deleteBook(
  userId: string,
  bookId: string,
): Promise<boolean> {
  const { count } = await db.book.deleteMany({
    where: { id: bookId, userId },
  });
  return count > 0;
}
