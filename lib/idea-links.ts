// How connections between ideas are described to the user. Safe for both
// server and client.
//
// Stored: { fromIdeaId, toIdeaId, type }. Shown: a phrase from the point of
// view of the idea you're looking at ("supports", "is supported by", …).
import type { IdeaLinkType } from "@/lib/generated/prisma/enums";

export const SYMMETRIC_TYPES: ReadonlySet<IdeaLinkType> = new Set([
  "CONTRADICTS",
  "RELATED",
]);

// The choices on the Connect page: "This idea ___ <other idea>".
// `reversed` means the other idea is the "from" end.
export const RELATIONS = {
  SUPPORTS: { type: "SUPPORTS", reversed: false, label: "supports" },
  SUPPORTED_BY: { type: "SUPPORTS", reversed: true, label: "is supported by" },
  EXTENDS: { type: "EXTENDS", reversed: false, label: "builds on" },
  EXTENDED_BY: { type: "EXTENDS", reversed: true, label: "is built upon by" },
  CONTRADICTS: { type: "CONTRADICTS", reversed: false, label: "contradicts" },
  RELATED: { type: "RELATED", reversed: false, label: "is related to" },
} as const satisfies Record<
  string,
  { type: IdeaLinkType; reversed: boolean; label: string }
>;

export type Relation = keyof typeof RELATIONS;

// Section headings on an idea's page, in display order.
export const CONNECTION_GROUPS = [
  "Supports",
  "Supported by",
  "Builds on",
  "Built upon by",
  "Contradicts",
  "Related",
] as const;

export type ConnectionGroup = (typeof CONNECTION_GROUPS)[number];

// Which heading a stored link belongs under, seen from `ideaId`'s side.
export function connectionGroup(
  link: { type: IdeaLinkType; fromIdeaId: string },
  ideaId: string,
): ConnectionGroup {
  const outgoing = link.fromIdeaId === ideaId;
  switch (link.type) {
    case "SUPPORTS":
      return outgoing ? "Supports" : "Supported by";
    case "EXTENDS":
      return outgoing ? "Builds on" : "Built upon by";
    case "CONTRADICTS":
      return "Contradicts";
    case "RELATED":
      return "Related";
  }
}
