import "server-only";

import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { normalizeTagName } from "@/lib/tags";

// These helpers take a transaction client (`tx`) so callers can run them
// together with their own writes: all succeed, or none do.

// Ids of the user's tags with these names (normalized here), creating any
// that don't exist yet. Two queries however many names there are:
// skipDuplicates becomes "ON CONFLICT DO NOTHING", so existing names (or ones
// created by a simultaneous request) don't cause an error.
async function getOrCreateTagIds(
  tx: Prisma.TransactionClient,
  userId: string,
  rawNames: string[],
): Promise<string[]> {
  // Normalize here, not only in form validation, so no caller (imports,
  // future AI suggestions) can create "Focus" next to "focus".
  const names = [...new Set(rawNames.map(normalizeTagName).filter(Boolean))];
  if (names.length === 0) return [];
  await tx.tag.createMany({
    data: names.map((name) => ({ userId, name })),
    skipDuplicates: true,
  });
  const tags = await tx.tag.findMany({
    where: { userId, name: { in: names } },
    select: { id: true },
  });
  return tags.map((tag) => tag.id);
}

// Replaces a note's tags with exactly `names`.
export async function setNoteTags(
  tx: Prisma.TransactionClient,
  userId: string,
  noteId: string,
  names: string[],
) {
  await tx.noteTag.deleteMany({ where: { noteId } });
  const tagIds = await getOrCreateTagIds(tx, userId, names);
  await tx.noteTag.createMany({
    data: tagIds.map((tagId) => ({ noteId, tagId })),
  });
}

// Replaces an idea's tags with exactly `names`.
export async function setIdeaTags(
  tx: Prisma.TransactionClient,
  userId: string,
  ideaId: string,
  names: string[],
) {
  await tx.ideaTag.deleteMany({ where: { ideaId } });
  const tagIds = await getOrCreateTagIds(tx, userId, names);
  await tx.ideaTag.createMany({
    data: tagIds.map((tagId) => ({ ideaId, tagId })),
  });
}

// Removes tags no longer on any note or idea, so the tag list stays tidy.
export async function deleteUnusedTags(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  await tx.tag.deleteMany({
    where: { userId, notes: { none: {} }, ideas: { none: {} } },
  });
}

// All of a user's tags with how many notes and ideas use each.
export async function listTagsWithCounts(userId: string) {
  const tags = await db.tag.findMany({
    where: { userId },
    select: {
      name: true,
      _count: { select: { notes: true, ideas: true } },
    },
  });
  return tags
    .map((tag) => ({
      name: tag.name,
      noteCount: tag._count.notes,
      ideaCount: tag._count.ideas,
    }))
    .sort(
      (a, b) =>
        b.noteCount + b.ideaCount - (a.noteCount + a.ideaCount) ||
        a.name.localeCompare(b.name),
    );
}
