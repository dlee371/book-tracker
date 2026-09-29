import type { Metadata } from "next";

import { createBookAction } from "@/app/books/actions";
import { BookForm } from "@/components/books/book-form";

export const metadata: Metadata = { title: "Add book · Book Tracker" };

export default function NewBookPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add a book</h1>
      <BookForm action={createBookAction} submitLabel="Add book" />
    </div>
  );
}
