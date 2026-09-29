import "server-only";

import { db } from "@/lib/db";
import type { BookInput } from "@/lib/validation/book";

// All book data access goes through these functions. Every query includes
// userId, so a user can only ever read or change their own books.

export function listBooks(userId: string) {
  return db.book.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export function getBook(userId: string, bookId: string) {
  return db.book.findFirst({ where: { id: bookId, userId } });
}

export function createBook(userId: string, input: BookInput) {
  return db.book.create({ data: { ...input, userId } });
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
    data: input,
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
