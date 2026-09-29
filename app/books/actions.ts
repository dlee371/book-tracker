"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUserId } from "@/lib/current-user";
import { formValues, type FormState } from "@/lib/form-state";
import { createBook, deleteBook, updateBook } from "@/lib/services/books";
import { bookSchema } from "@/lib/validation/book";

// Server actions can be called by anyone who can send a POST request, not
// just our forms. So each action looks up the user itself and validates its
// input, and the service scopes every query to that user.

export async function createBookAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await getCurrentUserId();
  const values = formValues(formData);

  const parsed = bookSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const book = await createBook(userId, parsed.data);
  revalidatePath("/books");
  redirect(`/books/${book.id}`);
}

// bookId is supplied with .bind() on the edit page. It still comes back from
// the browser, so it's untrusted; updateBook only matches the user's own books.
export async function updateBookAction(
  bookId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
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
  redirect(`/books/${bookId}`);
}

export async function deleteBookAction(bookId: string): Promise<void> {
  const userId = await getCurrentUserId();
  await deleteBook(userId, bookId);
  revalidatePath("/books");
  redirect("/books");
}
