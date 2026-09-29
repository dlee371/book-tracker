import Link from "next/link";

import { BookCover } from "@/components/books/book-cover";
import { RatingStars } from "@/components/books/rating-stars";
import { formatCalendarDate } from "@/lib/dates";

type MiniBook = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  rating: number | null;
};

// Compact book rows for the dashboard. `show` picks the secondary detail.
export function BookMiniList({
  books,
  show,
  empty,
}: {
  books: MiniBook[];
  show: "started" | "finished" | "none";
  empty: string;
}) {
  if (books.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="grid gap-2">
      {books.map((book) => (
        <li key={book.id}>
          <Link
            href={`/books/${book.id}`}
            className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-muted/60"
          >
            <BookCover url={book.coverUrl} title={book.title} />
            <span className="grid min-w-0 gap-0.5">
              <span className="truncate text-sm font-medium">{book.title}</span>
              <span className="truncate text-xs text-muted-foreground">{book.author}</span>
              <span className="text-xs text-muted-foreground">
                {show === "started" &&
                  (book.startedAt
                    ? `Started ${formatCalendarDate(book.startedAt)}`
                    : "Start date not set")}
                {show === "finished" && (
                  <>
                    {book.finishedAt && formatCalendarDate(book.finishedAt)}
                    {book.rating && (
                      <>
                        {" "}
                        <RatingStars rating={book.rating} />
                      </>
                    )}
                  </>
                )}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
