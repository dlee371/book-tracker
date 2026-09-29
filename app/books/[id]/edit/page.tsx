import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { deleteBookAction, updateBookAction } from "@/app/books/actions";
import { BookForm } from "@/components/books/book-form";
import { DeleteBookButton } from "@/components/books/delete-book-button";
import { toBookFormValues } from "@/lib/books";
import { getCurrentUserId } from "@/lib/current-user";
import { getBook } from "@/lib/services/books";

export const metadata: Metadata = { title: "Edit book · Book Tracker" };

export default async function EditBookPage({
  params,
}: PageProps<"/books/[id]/edit">) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const book = await getBook(userId, id);

  // Missing, or belongs to someone else: both look like "not found".
  if (!book) notFound();

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit book</h1>
      <BookForm
        action={updateBookAction.bind(null, book.id)}
        initialValues={toBookFormValues(book)}
        submitLabel="Save changes"
      />
      <div className="border-t pt-6">
        <DeleteBookButton action={deleteBookAction.bind(null, book.id)} />
      </div>
    </div>
  );
}
