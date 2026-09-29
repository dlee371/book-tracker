import "server-only";

import { cache } from "react";

import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { deleteUnusedTags, setIdeaTags } from "@/lib/services/tags";
import type { IdeaInput } from "@/lib/validation/idea";

// Idea data access. Every query is scoped to the user, and anything linked to
// an idea (books, notes) must belong to that user too.

const ideaInclude = {
  sources: {
    include: {
      book: { select: { id: true, title: true, author: true, coverUrl: true } },
    },
    orderBy: { book: { title: "asc" } },
  },
  notes: {
    include: { note: { include: { book: { select: { id: true, title: true } } } } },
    orderBy: { note: { createdAt: "asc" } },
  },
  tags: { include: { tag: true }, orderBy: { tag: { name: "asc" } } },
} satisfies Prisma.IdeaInclude;

export type IdeaWithDetails = Prisma.IdeaGetPayload<{
  include: typeof ideaInclude;
}>;

// Most recently updated first. Optionally only ideas with a given tag, or
// whose title contains `q` (case-insensitive).
export function listIdeas(
  userId: string,
  options: { tag?: string; q?: string } = {},
) {
  return db.idea.findMany({
    where: {
      userId,
      ...(options.tag && { tags: { some: { tag: { name: options.tag } } } }),
      ...(options.q && { title: { contains: options.q, mode: "insensitive" } }),
    },
    include: ideaInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export function listIdeasForBook(userId: string, bookId: string) {
  return db.idea.findMany({
    where: { userId, sources: { some: { bookId } } },
    include: ideaInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export const getIdea = cache((userId: string, ideaId: string) => {
  return db.idea.findFirst({
    where: { id: ideaId, userId },
    include: ideaInclude,
  });
});

// Thrown when input refers to books or notes the user doesn't own (or that
// no longer exist). Throwing inside a transaction rolls back every write.
export class NotOwnedError extends Error {}

// Checks that all these notes belong to the user; returns their book ids.
async function ownedNoteBookIds(
  tx: Prisma.TransactionClient,
  userId: string,
  noteIds: string[],
): Promise<string[]> {
  if (noteIds.length === 0) return [];
  const notes = await tx.note.findMany({
    where: { id: { in: noteIds }, userId },
    select: { bookId: true },
  });
  if (notes.length !== new Set(noteIds).size) throw new NotOwnedError();
  return notes.map((note) => note.bookId);
}

// Makes the idea's sources exactly `bookIds` plus the books of its supporting
// notes, after checking the user owns all of them.
async function setIdeaSources(
  tx: Prisma.TransactionClient,
  userId: string,
  ideaId: string,
  bookIds: string[],
) {
  const supportingNotes = await tx.ideaNote.findMany({
    where: { ideaId },
    select: { note: { select: { bookId: true } } },
  });
  const allBookIds = [
    ...new Set([...bookIds, ...supportingNotes.map((n) => n.note.bookId)]),
  ];

  const ownedCount = await tx.book.count({
    where: { id: { in: allBookIds }, userId },
  });
  if (ownedCount !== allBookIds.length) throw new NotOwnedError();

  await tx.ideaSource.deleteMany({ where: { ideaId } });
  await tx.ideaSource.createMany({
    data: allBookIds.map((bookId) => ({ ideaId, bookId })),
  });
}

export async function createIdea(userId: string, input: IdeaInput) {
  const { tags, bookIds, noteIds, ...fields } = input;

  return db.$transaction(async (tx) => {
    await ownedNoteBookIds(tx, userId, noteIds);
    const idea = await tx.idea.create({ data: { ...fields, userId } });
    await tx.ideaNote.createMany({
      data: [...new Set(noteIds)].map((noteId) => ({ ideaId: idea.id, noteId })),
    });
    await setIdeaSources(tx, userId, idea.id, bookIds);
    await setIdeaTags(tx, userId, idea.id, tags);
    return idea;
  });
}

// Updates fields, sources and tags. Supporting notes are managed separately
// (linkNoteToIdea / unlinkNoteFromIdea), so input.noteIds is ignored here.
export async function updateIdea(
  userId: string,
  ideaId: string,
  input: IdeaInput,
): Promise<boolean> {
  const { title, explanation, tags, bookIds } = input;
  const fields = { title, explanation };

  return db.$transaction(async (tx) => {
    const { count } = await tx.idea.updateMany({
      where: { id: ideaId, userId },
      data: fields,
    });
    if (count === 0) return false;

    await setIdeaSources(tx, userId, ideaId, bookIds);
    await setIdeaTags(tx, userId, ideaId, tags);
    await deleteUnusedTags(tx, userId);
    return true;
  });
}

export async function deleteIdea(
  userId: string,
  ideaId: string,
): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const { count } = await tx.idea.deleteMany({
      where: { id: ideaId, userId },
    });
    await deleteUnusedTags(tx, userId);
    return count > 0;
  });
}

// Adds a note as support for an existing idea, and its book as a source.
// Returns false if either doesn't belong to the user.
export async function linkNoteToIdea(
  userId: string,
  ideaId: string,
  noteId: string,
): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const [idea, note] = await Promise.all([
      tx.idea.findFirst({ where: { id: ideaId, userId }, select: { id: true } }),
      tx.note.findFirst({
        where: { id: noteId, userId },
        select: { bookId: true },
      }),
    ]);
    if (!idea || !note) return false;

    await tx.ideaNote.createMany({
      data: [{ ideaId, noteId }],
      skipDuplicates: true,
    });
    await tx.ideaSource.createMany({
      data: [{ ideaId, bookId: note.bookId }],
      skipDuplicates: true,
    });
    // Linking counts as an update, so the idea rises to the top of the list.
    await tx.idea.update({ where: { id: ideaId }, data: { updatedAt: new Date() } });
    return true;
  });
}

// Removes a supporting note. The note's book stays a source; remove it by
// editing the idea if it no longer applies.
export async function unlinkNoteFromIdea(
  userId: string,
  ideaId: string,
  noteId: string,
): Promise<boolean> {
  const { count } = await db.ideaNote.deleteMany({
    where: { ideaId, noteId, idea: { userId } },
  });
  return count > 0;
}
