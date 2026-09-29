import "server-only";

import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { deleteUnusedTags, setNoteTags } from "@/lib/services/tags";
import type { NoteInput } from "@/lib/validation/note";

// Note data access. Like books, every query is scoped to the user.

// What to load with each note: its tags (A–Z) and which book it's from.
const noteInclude = {
  tags: { include: { tag: true }, orderBy: { tag: { name: "asc" } } },
  book: { select: { id: true, title: true } },
} satisfies Prisma.NoteInclude;

export type NoteWithDetails = Prisma.NoteGetPayload<{
  include: typeof noteInclude;
}>;

// Reading order: by page (notes without a page last), then oldest first.
export function listNotesForBook(userId: string, bookId: string) {
  return db.note.findMany({
    where: { userId, bookId },
    include: noteInclude,
    orderBy: [{ page: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
  });
}

// Every note with this tag, across all books, newest first.
export function listNotesForTag(userId: string, tagName: string) {
  return db.note.findMany({
    where: { userId, tags: { some: { tag: { name: tagName } } } },
    include: noteInclude,
    orderBy: { createdAt: "desc" },
  });
}

export function getNote(userId: string, noteId: string) {
  return db.note.findFirst({
    where: { id: noteId, userId },
    include: noteInclude,
  });
}

// Returns null if the book doesn't exist or belongs to someone else. Without
// this check, a crafted request could attach a note to another user's book.
export async function createNote(
  userId: string,
  bookId: string,
  input: NoteInput,
) {
  const { tags, ...fields } = input;

  const book = await db.book.findFirst({
    where: { id: bookId, userId },
    select: { id: true },
  });
  if (!book) return null;

  // One transaction: the note and its tags are saved together or not at all.
  return db.$transaction(async (tx) => {
    const note = await tx.note.create({ data: { ...fields, userId, bookId } });
    await setNoteTags(tx, userId, note.id, tags);
    return note;
  });
}

// A note never moves to a different book, so updates only need the user check.
export async function updateNote(
  userId: string,
  noteId: string,
  input: NoteInput,
): Promise<boolean> {
  const { tags, ...fields } = input;

  return db.$transaction(async (tx) => {
    const { count } = await tx.note.updateMany({
      where: { id: noteId, userId },
      data: fields,
    });
    if (count === 0) return false;

    await setNoteTags(tx, userId, noteId, tags);
    await deleteUnusedTags(tx, userId);
    return true;
  });
}

export async function deleteNote(
  userId: string,
  noteId: string,
): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const { count } = await tx.note.deleteMany({
      where: { id: noteId, userId },
    });
    await deleteUnusedTags(tx, userId);
    return count > 0;
  });
}
