import type { Metadata } from "next";
import Link from "next/link";
import { BookIcon, PlusIcon } from "lucide-react";

import {
  LibrarySearch,
  StatusTabs,
} from "@/components/books/library-toolbar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { STATUS_LABELS } from "@/lib/books";
import { getCurrentUserId } from "@/lib/current-user";
import { formatCalendarDate } from "@/lib/dates";
import type { Book } from "@/lib/generated/prisma/client";
import { isFiltered, parseLibraryQuery } from "@/lib/library-query";
import { countBooksByStatus, listBooks } from "@/lib/services/books";

export const metadata: Metadata = { title: "Library · Book Tracker" };

export default async function BooksPage({
  searchParams,
}: PageProps<"/books">) {
  const query = parseLibraryQuery(await searchParams);
  const userId = await getCurrentUserId();

  // The two queries don't depend on each other, so run them at the same time.
  const [books, counts] = await Promise.all([
    listBooks(userId, query),
    countBooksByStatus(userId, query.q),
  ]);
  const libraryIsEmpty =
    !isFiltered(query) && Object.values(counts).every((n) => n === 0);

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
        <Link href="/books/new" className={buttonVariants()}>
          <PlusIcon /> Add book
        </Link>
      </div>

      {libraryIsEmpty ? (
        <EmptyState title="No books yet">
          Add the book you&apos;re reading now to get started.
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-3">
            <LibrarySearch query={query} />
            <StatusTabs query={query} counts={counts} />
          </div>
          {books.length === 0 ? (
            <EmptyState title="No books match">
              <Link
                href="/books"
                className="text-foreground underline underline-offset-4"
              >
                Clear filters
              </Link>
            </EmptyState>
          ) : (
            <BookList books={books} />
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed p-12 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function BookList({ books }: { books: Book[] }) {
  return (
    <ul className="grid gap-3">
      {books.map((book) => (
        <li key={book.id}>
          <BookRow book={book} />
        </li>
      ))}
    </ul>
  );
}

function BookRow({ book }: { book: Book }) {
  return (
    <Link
      href={`/books/${book.id}/edit`}
      className="flex gap-4 rounded-xl border p-3 transition-colors hover:bg-muted/50"
    >
      <Cover url={book.coverUrl} title={book.title} />
      <div className="grid min-w-0 flex-1 content-start gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{book.title}</span>
          <Badge variant={book.status === "READING" ? "default" : "secondary"}>
            {STATUS_LABELS[book.status]}
          </Badge>
        </div>
        <span className="text-sm text-muted-foreground">{book.author}</span>
        <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
          {book.rating && (
            <span aria-label={`${book.rating} out of 5 stars`}>
              {"★".repeat(book.rating)}
              <span className="opacity-30">{"★".repeat(5 - book.rating)}</span>
            </span>
          )}
          {book.genre && <span>{book.genre}</span>}
          {book.finishedAt && (
            <span>Finished {formatCalendarDate(book.finishedAt)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function Cover({ url, title }: { url: string | null; title: string }) {
  if (!url) {
    return (
      <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
        <BookIcon className="size-4" />
      </div>
    );
  }
  // A plain <img> on purpose: next/image only allows hosts listed in advance,
  // and cover URLs can point anywhere.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`Cover of ${title}`}
      className="h-16 w-11 shrink-0 rounded object-cover"
    />
  );
}
