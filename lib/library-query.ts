import { z } from "zod";

import { ReadingStatus } from "@/lib/generated/prisma/enums";

// The library's search, filter and sort live in the URL, e.g.
// /books?q=habits&status=READING&sort=rating
// This file turns those search params into a typed query and back.

export const SORT_OPTIONS = {
  added: "Recently added",
  title: "Title",
  author: "Author",
  rating: "Rating",
  finished: "Date finished",
} as const;

export type LibrarySort = keyof typeof SORT_OPTIONS;

export type LibraryQuery = {
  q: string;
  status: ReadingStatus | null; // null = all statuses
  sort: LibrarySort;
};

const DEFAULTS: LibraryQuery = { q: "", status: null, sort: "added" };

// URLs are user input and can contain anything. .catch() swaps an invalid
// value for the default instead of failing, so a bad link still shows the
// library.
const querySchema = z.object({
  q: z.string().trim().max(200).catch(DEFAULTS.q),
  status: z.enum(ReadingStatus).nullable().catch(DEFAULTS.status),
  sort: z
    .enum(Object.keys(SORT_OPTIONS) as [LibrarySort, ...LibrarySort[]])
    .catch(DEFAULTS.sort),
});

type SearchParams = Record<string, string | string[] | undefined>;

export function parseLibraryQuery(params: SearchParams): LibraryQuery {
  // A param can appear twice (?q=a&q=b); use the first one.
  const first = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  return querySchema.parse({
    q: first("q") ?? DEFAULTS.q,
    status: first("status") ?? DEFAULTS.status,
    sort: first("sort") ?? DEFAULTS.sort,
  });
}

// Builds a /books URL for the current query with some values changed.
// Default values are left out to keep URLs short.
export function libraryHref(
  query: LibraryQuery,
  changes: Partial<LibraryQuery> = {},
): string {
  const next = { ...query, ...changes };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.status) params.set("status", next.status);
  if (next.sort !== DEFAULTS.sort) params.set("sort", next.sort);
  const search = params.toString();
  return search ? `/books?${search}` : "/books";
}

export function isFiltered(query: LibraryQuery): boolean {
  return query.q !== "" || query.status !== null;
}
