import "server-only";

import { db } from "@/lib/db";
import type { NoteInput } from "@/lib/validation/note";

// Note data access. Like books, every query is scoped to the user.

// Reading order: by page (notes without a page last), then oldest first.
export function listNotesForBook(userId: string, bookId: string) {
  return db.note.findMany({
    where: { userId, bookId },
    orderBy: [{ page: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
  });
}

export function getNote(userId: string, noteId: string) {
  return db.note.findFirst({ where: { id: noteId, userId } });
}

// Returns null if the book doesn't exist or belongs to someone else. Without
// this check, a crafted request could attach a note to another user's book.
export async function createNote(
  userId: string,
  bookId: string,
  input: NoteInput,
) {
  const book = await db.book.findFirst({
    where: { id: bookId, userId },
    select: { id: true },
  });
  if (!book) return null;

  return db.note.create({ data: { ...input, userId, bookId } });
}

// A note never moves to a different book, so updates only need the user check.
export async function updateNote(
  userId: string,
  noteId: string,
  input: NoteInput,
): Promise<boolean> {
  const { count } = await db.note.updateMany({
    where: { id: noteId, userId },
    data: input,
  });
  return count > 0;
}

export async function deleteNote(
  userId: string,
  noteId: string,
): Promise<boolean> {
  const { count } = await db.note.deleteMany({
    where: { id: noteId, userId },
  });
  return count > 0;
}
