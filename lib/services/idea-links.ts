import "server-only";

import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { RELATIONS, SYMMETRIC_TYPES } from "@/lib/idea-links";
import type { ConnectInput } from "@/lib/validation/idea-link";

export type ConnectResult = { ok: true } | { ok: false; error: string };

// Connects `ideaId` to input.targetIdeaId, phrased from ideaId's side
// ("this idea supports …"). Both ideas must belong to the user.
export async function connectIdeas(
  userId: string,
  ideaId: string,
  input: ConnectInput,
): Promise<ConnectResult> {
  const { type, reversed } = RELATIONS[input.relation];
  let fromIdeaId = reversed ? input.targetIdeaId : ideaId;
  let toIdeaId = reversed ? ideaId : input.targetIdeaId;

  if (fromIdeaId === toIdeaId) {
    return { ok: false, error: "An idea can't be connected to itself." };
  }

  const owned = await db.idea.count({
    where: { id: { in: [fromIdeaId, toIdeaId] }, userId },
  });
  if (owned !== 2) {
    return { ok: false, error: "That idea no longer exists." };
  }

  // Symmetric links are stored in one canonical order (smaller id first) so
  // "A contradicts B" and "B contradicts A" are the same row.
  if (SYMMETRIC_TYPES.has(type) && fromIdeaId > toIdeaId) {
    [fromIdeaId, toIdeaId] = [toIdeaId, fromIdeaId];
  }

  try {
    await db.ideaLink.create({
      data: { userId, fromIdeaId, toIdeaId, type, comment: input.comment },
    });
  } catch (error) {
    // P2002 = unique constraint violated: this exact connection exists.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "These ideas are already connected that way." };
    }
    throw error;
  }
  return { ok: true };
}

export async function deleteIdeaLink(
  userId: string,
  linkId: string,
): Promise<boolean> {
  const { count } = await db.ideaLink.deleteMany({
    where: { id: linkId, userId },
  });
  return count > 0;
}

// Every connection touching this idea, with the idea at the other end.
export async function listConnections(userId: string, ideaId: string) {
  const links = await db.ideaLink.findMany({
    where: { userId, OR: [{ fromIdeaId: ideaId }, { toIdeaId: ideaId }] },
    include: {
      fromIdea: { select: { id: true, title: true } },
      toIdea: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return links.map((link) => ({
    ...link,
    otherIdea: link.fromIdeaId === ideaId ? link.toIdea : link.fromIdea,
  }));
}

export type Connection = Awaited<ReturnType<typeof listConnections>>[number];
