import "server-only";

import { db } from "@/lib/db";
import type { IdeaLinkType } from "@/lib/generated/prisma/enums";
import { tagHref } from "@/lib/tags";

// The knowledge graph: ideas, the books they come from, and their tags.
// Notes are left out on purpose; they would outnumber everything else and
// turn the picture into a hairball. They're one click away on idea pages.

export type GraphNodeKind = "idea" | "book" | "tag";
export type GraphEdgeKind = "source" | "tag" | IdeaLinkType;

export type GraphNode = {
  id: string; // "idea:<id>", "book:<id>", "tag:<id>"
  kind: GraphNodeKind;
  label: string;
  href: string;
};

export type GraphEdge = {
  source: string;
  target: string;
  kind: GraphEdgeKind;
};

export type Graph = { nodes: GraphNode[]; edges: GraphEdge[] };

export async function getGraph(
  userId: string,
  options: { focusIdeaId?: string; depth?: number; includeTags?: boolean } = {},
): Promise<Graph> {
  const { focusIdeaId, depth = 2, includeTags = true } = options;

  const [ideas, links] = await Promise.all([
    db.idea.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        sources: { select: { book: { select: { id: true, title: true } } } },
        tags: { select: { tag: { select: { id: true, name: true } } } },
      },
    }),
    db.ideaLink.findMany({
      where: { userId },
      select: { fromIdeaId: true, toIdeaId: true, type: true },
    }),
  ]);

  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  for (const idea of ideas) {
    const ideaNode = `idea:${idea.id}`;
    nodes.set(ideaNode, {
      id: ideaNode,
      kind: "idea",
      label: idea.title,
      href: `/ideas/${idea.id}`,
    });
    for (const { book } of idea.sources) {
      const bookNode = `book:${book.id}`;
      nodes.set(bookNode, { id: bookNode, kind: "book", label: book.title, href: `/books/${book.id}` });
      edges.push({ source: ideaNode, target: bookNode, kind: "source" });
    }
    if (includeTags) {
      for (const { tag } of idea.tags) {
        const tagNode = `tag:${tag.id}`;
        nodes.set(tagNode, { id: tagNode, kind: "tag", label: `#${tag.name}`, href: tagHref(tag.name) });
        edges.push({ source: ideaNode, target: tagNode, kind: "tag" });
      }
    }
  }
  for (const link of links) {
    edges.push({
      source: `idea:${link.fromIdeaId}`,
      target: `idea:${link.toIdeaId}`,
      kind: link.type,
    });
  }

  const graph = focusIdeaId
    ? neighborhood({ nodes: [...nodes.values()], edges }, `idea:${focusIdeaId}`, depth)
    : { nodes: [...nodes.values()], edges };

  // A stable order means the same layout every time (d3-force's starting
  // positions and "random" nudges are deterministic for a given order).
  graph.nodes.sort((a, b) => a.id.localeCompare(b.id));
  return graph;
}

// Everything within `depth` steps of `startId`, following edges in either
// direction (breadth-first search).
function neighborhood(graph: Graph, startId: string, depth: number): Graph {
  if (!graph.nodes.some((node) => node.id === startId)) {
    return { nodes: [], edges: [] };
  }

  const neighbors = new Map<string, string[]>();
  for (const { source, target } of graph.edges) {
    neighbors.set(source, [...(neighbors.get(source) ?? []), target]);
    neighbors.set(target, [...(neighbors.get(target) ?? []), source]);
  }

  const kept = new Set([startId]);
  let frontier = [startId];
  for (let step = 0; step < depth; step++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const neighbor of neighbors.get(id) ?? []) {
        if (!kept.has(neighbor)) {
          kept.add(neighbor);
          next.push(neighbor);
        }
      }
    }
    frontier = next;
  }

  return {
    nodes: graph.nodes.filter((node) => kept.has(node.id)),
    edges: graph.edges.filter((e) => kept.has(e.source) && kept.has(e.target)),
  };
}
