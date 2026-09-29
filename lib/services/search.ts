import "server-only";

import { db } from "@/lib/db";
import { MATCH_END, MATCH_START } from "@/lib/search-markers";
import { normalizeTagName } from "@/lib/tags";

// Global search across ideas, notes, books and tags, using Postgres full-text
// search on the generated `search` columns (see the add_search migration).
//
// Raw SQL is needed because Prisma can't express tsquery/ts_rank/ts_headline.
// In db.$queryRaw`...${value}...`, every ${} becomes a query *parameter*: it
// is sent separately from the SQL text, so user input can't change the query.

const LIMIT = 10;

// Options for ts_headline: highlight whole titles; for bodies, show one
// fragment of about 12–30 words around the best match.
const TITLE_OPTIONS = `HighlightAll=true, StartSel=${MATCH_START}, StopSel=${MATCH_END}`;
const SNIPPET_OPTIONS = `MaxFragments=1, MinWords=12, MaxWords=30, StartSel=${MATCH_START}, StopSel=${MATCH_END}`;

// "Hab env!" -> "hab:* & env:*": every word must match, as a prefix.
// Keeping only letters and digits means tsquery syntax (& | ! : ( ) ') typed
// by the user can't cause a syntax error. Single letters are dropped: as a
// prefix, "b:*" matches almost everything.
export function toPrefixQuery(input: string): string | null {
  const words = (input.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(
    (word) => word.length > 1,
  );
  if (words.length === 0) return null;
  return words
    .slice(0, 10)
    .map((word) => `${word}:*`)
    .join(" & ");
}

type IdeaHit = { id: string; title: string; snippet: string };
type NoteHit = {
  id: string;
  bookId: string;
  bookTitle: string;
  page: number | null;
  title: string;
  snippet: string;
};
type BookHit = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  snippet: string;
};
type TagHit = { name: string; uses: number };

export type SearchResults = {
  ideas: IdeaHit[];
  notes: NoteHit[];
  books: BookHit[];
  tags: TagHit[];
};

export async function searchEverything(
  userId: string,
  input: string,
): Promise<SearchResults> {
  const query = toPrefixQuery(input);
  const tagQuery = normalizeTagName(input);
  if (!query) return { ideas: [], notes: [], books: [], tags: [] };

  // Independent queries, so run them at the same time.
  const [ideas, notes, books, tags] = await Promise.all([
    db.$queryRaw<IdeaHit[]>`
      SELECT r.id,
             ts_headline('english', r.title, q, ${TITLE_OPTIONS}) AS title,
             ts_headline('english', coalesce(r.explanation, ''), q, ${SNIPPET_OPTIONS}) AS snippet
      FROM (
        SELECT id, title, explanation, ts_rank(search, q) AS rank
        FROM ideas, to_tsquery('english', ${query}) q
        WHERE "userId" = ${userId} AND search @@ q
        ORDER BY rank DESC, "updatedAt" DESC
        LIMIT ${LIMIT}
      ) r, to_tsquery('english', ${query}) q
      ORDER BY r.rank DESC`,

    db.$queryRaw<NoteHit[]>`
      SELECT r.id, r."bookId", r."bookTitle", r.page,
             ts_headline('english', coalesce(r.title, ''), q, ${TITLE_OPTIONS}) AS title,
             ts_headline('english', r.body, q, ${SNIPPET_OPTIONS}) AS snippet
      FROM (
        SELECT n.id, n."bookId", b.title AS "bookTitle", n.page, n.title, n.body,
               ts_rank(n.search, q) AS rank
        FROM notes n
        JOIN books b ON b.id = n."bookId",
             to_tsquery('english', ${query}) q
        WHERE n."userId" = ${userId} AND n.search @@ q
        ORDER BY rank DESC, n."createdAt" DESC
        LIMIT ${LIMIT}
      ) r, to_tsquery('english', ${query}) q
      ORDER BY r.rank DESC`,

    db.$queryRaw<BookHit[]>`
      SELECT r.id, r."coverUrl",
             ts_headline('english', r.title, q, ${TITLE_OPTIONS}) AS title,
             ts_headline('english', r.author, q, ${TITLE_OPTIONS}) AS author,
             ts_headline('english', concat_ws(' ', r.description, r.review), q, ${SNIPPET_OPTIONS}) AS snippet
      FROM (
        SELECT id, title, author, "coverUrl", description, review,
               ts_rank(search, q) AS rank
        FROM books, to_tsquery('english', ${query}) q
        WHERE "userId" = ${userId} AND search @@ q
        ORDER BY rank DESC, title
        LIMIT ${LIMIT}
      ) r, to_tsquery('english', ${query}) q
      ORDER BY r.rank DESC`,

    // Tags are short, so a plain substring match is enough: "habit" finds
    // #habits. strpos avoids LIKE, where % and _ in the input would be
    // wildcards. ::int because Postgres counts are bigint, which arrive in
    // JavaScript as BigInt.
    db.$queryRaw<TagHit[]>`
      SELECT t.name,
             ((SELECT count(*) FROM note_tags nt WHERE nt."tagId" = t.id) +
              (SELECT count(*) FROM idea_tags it WHERE it."tagId" = t.id))::int AS uses
      FROM tags t
      WHERE t."userId" = ${userId} AND strpos(t.name, ${tagQuery}) > 0
      ORDER BY uses DESC, t.name
      LIMIT ${LIMIT}`,
  ]);

  return {
    ideas: ideas.map((hit) => ({ ...hit, snippet: plainSnippet(hit.snippet) })),
    notes: notes.map((hit) => ({ ...hit, snippet: plainSnippet(hit.snippet) })),
    books: books.map((hit) => ({ ...hit, snippet: plainSnippet(hit.snippet) })),
    tags,
  };
}

// Snippets come from Markdown text; drop the syntax characters and extra
// whitespace so "**compound interest**\n" reads as "compound interest".
// (The match markers are private-use characters, so they're untouched.)
function plainSnippet(text: string): string {
  return text
    .replace(/[*_`~#>|]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
