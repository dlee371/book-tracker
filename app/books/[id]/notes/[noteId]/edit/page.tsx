import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { updateNoteAction } from "@/app/books/[id]/notes/actions";
import { NoteForm } from "@/components/notes/note-form";
import { getCurrentUserId } from "@/lib/current-user";
import { getNote } from "@/lib/services/notes";

export const metadata: Metadata = { title: "Edit note · Book Tracker" };

export default async function EditNotePage({
  params,
}: PageProps<"/books/[id]/notes/[noteId]/edit">) {
  const { id: bookId, noteId } = await params;
  const userId = await getCurrentUserId();
  const note = await getNote(userId, noteId);

  // Also 404 if the URL pairs a real note with the wrong book.
  if (!note || note.bookId !== bookId) notFound();

  const backHref = `/books/${bookId}#note-${note.id}`;

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit note</h1>
      <NoteForm
        action={updateNoteAction.bind(null, bookId, note.id)}
        initialValues={{
          title: note.title ?? "",
          page: note.page?.toString() ?? "",
          body: note.body,
        }}
        submitLabel="Save note"
        cancelHref={backHref}
      />
    </div>
  );
}
