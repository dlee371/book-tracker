import "server-only";

import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

// These helpers take a transaction client (`tx`) so callers can run them
// together with their own writes: all succeed, or none do.

// Replaces a note's tags with exactly `names` (already normalized).
export async function setNoteTags(
  tx: Prisma.TransactionClient,
  userId: string,
  noteId: string,
  names: string[],
) {
  await tx.noteTag.deleteMany({ where: { noteId } });
  if (names.length === 0) return;

  // Two queries however many tags there are. skipDuplicates becomes
  // "ON CONFLICT DO NOTHING", so existing names (or ones created by a
  // simultaneous request) don't cause an error.
  await tx.tag.createMany({
    data: names.map((name) => ({ userId, name })),
    skipDuplicates: true,
  });
  const tags = await tx.tag.findMany({
    where: { userId, name: { in: names } },
    select: { id: true },
  });

  await tx.noteTag.createMany({
    data: tags.map((tag) => ({ noteId, tagId: tag.id })),
  });
}

// Removes tags that are no longer on any note, so the tag list stays tidy.
// (Milestone 6 will also check ideas.)
export async function deleteUnusedTags(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  await tx.tag.deleteMany({ where: { userId, notes: { none: {} } } });
}

// All of a user's tags with how many notes use each, most used first.
export async function listTagsWithCounts(userId: string) {
  const tags = await db.tag.findMany({
    where: { userId },
    select: { name: true, _count: { select: { notes: true } } },
    orderBy: [{ notes: { _count: "desc" } }, { name: "asc" }],
  });
  return tags.map((tag) => ({ name: tag.name, noteCount: tag._count.notes }));
}
