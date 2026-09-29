import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { LightbulbIcon, SearchIcon } from "lucide-react";

import { BookCover } from "@/components/books/book-cover";
import { Highlight } from "@/components/highlight";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUserId } from "@/lib/current-user";
import { searchEverything, type SearchResults } from "@/lib/services/search";
import { tagHref } from "@/lib/tags";

export const metadata: Metadata = { title: "Search · Book Tracker" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim().slice(0, 200);
  const userId = await getCurrentUserId();
  const results = query ? await searchEverything(userId, query) : null;
  const total = results
    ? Object.values(results).reduce((sum, hits) => sum + hits.length, 0)
    : 0;

  return (
    <div className="grid gap-8">
      <Form action="/search" className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            // Remount when the query changes so the box shows the current one.
            key={query}
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search ideas, notes, books, authors and tags"
            aria-label="Search everything"
            className="pl-8"
            autoFocus={!query}
          />
        </div>
        <Button type="submit">Search</Button>
      </Form>

      {!results ? (
        <p className="text-sm text-muted-foreground">
          Search your whole library. Partial words work: “hab” finds habits.
        </p>
      ) : total === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="font-medium">Nothing found for “{query}”</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try fewer or shorter words.
          </p>
        </div>
      ) : (
        <Results results={results} />
      )}
    </div>
  );
}

function Results({ results }: { results: SearchResults }) {
  const { ideas, notes, books, tags } = results;
  return (
    <>
      {tags.length > 0 && (
        <Section title="Tags" count={tags.length}>
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag.name}>
                <Link
                  href={tagHref(tag.name)}
                  className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm hover:bg-muted"
                >
                  #{tag.name}
                  <span className="text-xs text-muted-foreground">{tag.uses}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {ideas.length > 0 && (
        <Section title="Ideas" count={ideas.length}>
          {ideas.map((idea) => (
            <ResultLink key={idea.id} href={`/ideas/${idea.id}`}>
              <span className="flex items-start gap-2 font-medium">
                <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <span>
                  <Highlight text={idea.title} />
                </span>
              </span>
              {idea.snippet && <Snippet text={idea.snippet} />}
            </ResultLink>
          ))}
        </Section>
      )}

      {notes.length > 0 && (
        <Section title="Notes" count={notes.length}>
          {notes.map((note) => (
            <ResultLink key={note.id} href={`/books/${note.bookId}#note-${note.id}`}>
              <span className="text-xs text-muted-foreground">
                {note.bookTitle}
                {note.page && `, p. ${note.page}`}
              </span>
              {note.title && (
                <span className="font-medium">
                  <Highlight text={note.title} />
                </span>
              )}
              <Snippet text={note.snippet} />
            </ResultLink>
          ))}
        </Section>
      )}

      {books.length > 0 && (
        <Section title="Books" count={books.length}>
          {books.map((book) => (
            <ResultLink key={book.id} href={`/books/${book.id}`}>
              <span className="flex gap-3">
                <BookCover url={book.coverUrl} title={book.title} />
                <span className="grid content-start gap-0.5">
                  <span className="font-medium">
                    <Highlight text={book.title} />
                  </span>
                  <span className="text-sm text-muted-foreground">
                    <Highlight text={book.author} />
                  </span>
                  {book.snippet && <Snippet text={book.snippet} />}
                </span>
              </span>
            </ResultLink>
          ))}
        </Section>
      )}
    </>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-3">
      <h2 className="font-semibold">
        {title} <span className="font-normal text-muted-foreground">{count}</span>
      </h2>
      {children}
    </section>
  );
}

function ResultLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="grid gap-1 rounded-xl border p-3 transition-colors hover:bg-muted/50"
    >
      {children}
    </Link>
  );
}

function Snippet({ text }: { text: string }) {
  return (
    <span className="line-clamp-2 text-sm text-muted-foreground">
      <Highlight text={text} />
    </span>
  );
}
