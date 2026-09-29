"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { BookFormValues } from "@/lib/books";
import { getCurrentUserId } from "@/lib/current-user";
import { createBook, deleteBook, updateBook } from "@/lib/services/books";
import { bookSchema } from "@/lib/validation/book";

// What a form action hands back to the form when something is wrong.
// On success the action redirects instead, so there's no success state.
export type BookFormState = {
  fieldErrors?: Partial<Record<string, string[]>>;
  message?: string;
  // The submitted values, so the form can re-fill itself after an error.
  values?: BookFormValues;
};

// Server actions can be called by anyone who can send a POST request, not
// just our forms. So each action looks up the user itself and validates its
// input, and the service scopes every query to that user.

export async function createBookAction(
  _prevState: BookFormState,
  formData: FormData,
): Promise<BookFormState> {
  const userId = await getCurrentUserId();
  const values = formValues(formData);

  const parsed = bookSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  await createBook(userId, parsed.data);
  revalidatePath("/books");
  redirect("/books");
}

// bookId is supplied with .bind() on the edit page. It still comes back from
// the browser, so it's untrusted; updateBook only matches the user's own books.
export async function updateBookAction(
  bookId: string,
  _prevState: BookFormState,
  formData: FormData,
): Promise<BookFormState> {
  const userId = await getCurrentUserId();
  const values = formValues(formData);

  const parsed = bookSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const updated = await updateBook(userId, bookId, parsed.data);
  if (!updated) {
    return { message: "This book no longer exists.", values };
  }

  revalidatePath("/books");
  redirect("/books");
}

export async function deleteBookAction(bookId: string): Promise<void> {
  const userId = await getCurrentUserId();
  await deleteBook(userId, bookId);
  revalidatePath("/books");
  redirect("/books");
}

function formValues(formData: FormData): BookFormValues {
  const values: BookFormValues = {};
  for (const [key, value] of formData) {
    // Skip React's internal fields (prefixed with "$") and file uploads.
    if (typeof value === "string" && !key.startsWith("$")) {
      values[key] = value;
    }
  }
  return values;
}
