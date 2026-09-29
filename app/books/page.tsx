import type { Metadata } from "next";
import Link from "next/link";
import { BookIcon, PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { STATUS_LABELS } from "@/lib/books";
import { getCurrentUserId } from "@/lib/current-user";
import { formatCalendarDate } from "@/lib/dates";
import type { Book } from "@/lib/generated/prisma/client";
import { listBooks } from "@/lib/services/books";

export const metadata: Metadata = { title: "Library · Book Tracker" };

export default async function BooksPage() {
  const userId = await getCurrentUserId();
  const books = await listBooks(userId);

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
          <p className="text-sm text-muted-foreground">
            {books.length} {books.length === 1 ? "book" : "books"}
          </p>
        </div>
        <Link href="/books/new" className={buttonVariants()}>
          <PlusIcon /> Add book
        </Link>
      </div>

      {books.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="font-medium">No books yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add the book you&apos;re reading now to get started.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {books.map((book) => (
            <li key={book.id}>
              <BookRow book={book} />
            </li>
          ))}
        </ul>
      )}
    </div>
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
