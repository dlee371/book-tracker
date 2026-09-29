// Book helpers that are safe to use in both server and client components.
import type { Book } from "@/lib/generated/prisma/client";
import { ReadingStatus } from "@/lib/generated/prisma/enums";
import { toDateInputValue } from "@/lib/dates";

export const STATUS_LABELS: Record<ReadingStatus, string> = {
  WANT_TO_READ: "Want to Read",
  READING: "Reading",
  COMPLETED: "Completed",
  ABANDONED: "Abandoned",
};

export const STATUS_OPTIONS = Object.values(ReadingStatus);

// Form fields hold strings, so convert a saved book into string values for
// the edit form's defaults.
export type BookFormValues = Record<string, string>;

export function toBookFormValues(book: Book): BookFormValues {
  return {
    title: book.title,
    author: book.author,
    coverUrl: book.coverUrl ?? "",
    description: book.description ?? "",
    genre: book.genre ?? "",
    publicationYear: book.publicationYear?.toString() ?? "",
    pageCount: book.pageCount?.toString() ?? "",
    status: book.status,
    startedAt: toDateInputValue(book.startedAt),
    finishedAt: toDateInputValue(book.finishedAt),
    rating: book.rating?.toString() ?? "",
    review: book.review ?? "",
  };
}
