"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUserId } from "@/lib/current-user";
import { formValues, type FormState } from "@/lib/form-state";
import { createNote, deleteNote, updateNote } from "@/lib/services/notes";
import { noteSchema } from "@/lib/validation/note";

// bookId and noteId come from .bind() on the page, but they travel through the
// browser, so they're untrusted. The notes service checks ownership.

export async function createNoteAction(
  bookId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await getCurrentUserId();
  const values = formValues(formData);

  const parsed = noteSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const note = await createNote(userId, bookId, parsed.data);
  if (!note) {
    return { message: "This book no longer exists.", values };
  }

  // Stay on the book page. Returning an empty state clears the form.
  revalidatePath(`/books/${bookId}`);
  return {};
}

export async function updateNoteAction(
  bookId: string,
  noteId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await getCurrentUserId();
  const values = formValues(formData);

  const parsed = noteSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const updated = await updateNote(userId, noteId, parsed.data);
  if (!updated) {
    return { message: "This note no longer exists.", values };
  }

  revalidatePath(`/books/${bookId}`);
  redirect(`/books/${bookId}#note-${noteId}`);
}

export async function deleteNoteAction(
  bookId: string,
  noteId: string,
): Promise<void> {
  const userId = await getCurrentUserId();
  await deleteNote(userId, noteId);
  revalidatePath(`/books/${bookId}`);
}
