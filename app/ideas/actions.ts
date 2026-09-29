"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUserId } from "@/lib/current-user";
import { formValues, type FormState } from "@/lib/form-state";
import {
  NotOwnedError,
  createIdea,
  deleteIdea,
  linkNoteToIdea,
  unlinkNoteFromIdea,
  updateIdea,
} from "@/lib/services/ideas";
import { connectIdeas, deleteIdeaLink } from "@/lib/services/idea-links";
import { ideaSchema } from "@/lib/validation/idea";
import { connectSchema } from "@/lib/validation/idea-link";

// Ideas appear on idea pages, book pages (ideas from this book, and on note
// cards) and tag pages, so refresh everything after a change.
function revalidateAll() {
  revalidatePath("/", "layout");
}

// Checkboxes and hidden inputs repeat the same name ("bookIds") once per
// value, so read those with getAll(). For re-filling the form after an
// error, they're joined into one comma-separated string.
function readIdeaForm(formData: FormData) {
  const bookIds = formData.getAll("bookIds").map(String);
  const noteIds = formData.getAll("noteIds").map(String);
  const values = {
    ...formValues(formData),
    bookIds: bookIds.join(","),
    noteIds: noteIds.join(","),
  };
  const parsed = ideaSchema.safeParse({ ...values, bookIds, noteIds });
  return { values, parsed };
}

const NOT_OWNED_MESSAGE =
  "Some of the linked books or notes no longer exist. Reload and try again.";

export async function createIdeaAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await getCurrentUserId();
  const { values, parsed } = readIdeaForm(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  let ideaId: string;
  try {
    ideaId = (await createIdea(userId, parsed.data)).id;
  } catch (error) {
    if (error instanceof NotOwnedError) return { message: NOT_OWNED_MESSAGE, values };
    throw error;
  }

  revalidateAll();
  redirect(`/ideas/${ideaId}`);
}

export async function updateIdeaAction(
  ideaId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await getCurrentUserId();
  const { values, parsed } = readIdeaForm(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  try {
    const updated = await updateIdea(userId, ideaId, parsed.data);
    if (!updated) return { message: "This idea no longer exists.", values };
  } catch (error) {
    if (error instanceof NotOwnedError) return { message: NOT_OWNED_MESSAGE, values };
    throw error;
  }

  revalidateAll();
  redirect(`/ideas/${ideaId}`);
}

export async function deleteIdeaAction(ideaId: string): Promise<void> {
  const userId = await getCurrentUserId();
  await deleteIdea(userId, ideaId);
  revalidateAll();
  redirect("/ideas");
}

export async function linkNoteToIdeaAction(
  noteId: string,
  ideaId: string,
): Promise<void> {
  const userId = await getCurrentUserId();
  const linked = await linkNoteToIdea(userId, ideaId, noteId);
  revalidateAll();
  redirect(linked ? `/ideas/${ideaId}` : "/ideas");
}

export async function unlinkNoteFromIdeaAction(
  ideaId: string,
  noteId: string,
): Promise<void> {
  const userId = await getCurrentUserId();
  await unlinkNoteFromIdea(userId, ideaId, noteId);
  revalidateAll();
}

export async function connectIdeasAction(
  ideaId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await getCurrentUserId();
  const values = formValues(formData);

  const parsed = connectSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const result = await connectIdeas(userId, ideaId, parsed.data);
  if (!result.ok) return { message: result.error, values };

  revalidateAll();
  redirect(`/ideas/${ideaId}#connections`);
}

export async function deleteIdeaLinkAction(linkId: string): Promise<void> {
  const userId = await getCurrentUserId();
  await deleteIdeaLink(userId, linkId);
  revalidateAll();
}
