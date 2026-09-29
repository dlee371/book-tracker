import type { Metadata } from "next";

import { createIdeaAction } from "@/app/ideas/actions";
import { IdeaForm } from "@/components/ideas/idea-form";
import { Markdown } from "@/components/markdown";
import { getCurrentUserId } from "@/lib/current-user";
import { listBookOptions } from "@/lib/services/books";
import { getNote } from "@/lib/services/notes";

export const metadata: Metadata = { title: "New idea · Book Tracker" };

// /ideas/new starts blank. /ideas/new?fromNote=<id> starts from a note: its
// text, tags, book and the note itself are pre-filled, and the user edits
// before saving.
export default async function NewIdeaPage({
  searchParams,
}: PageProps<"/ideas/new">) {
  const { fromNote } = await searchParams;
  const userId = await getCurrentUserId();

  const [books, note] = await Promise.all([
    listBookOptions(userId),
    typeof fromNote === "string" ? getNote(userId, fromNote) : null,
  ]);

  const initialValues = note
    ? {
        title: note.title ?? "",
        explanation: note.body,
        tags: note.tags.map(({ tag }) => tag.name).join(", "),
        bookIds: note.bookId,
        noteIds: note.id,
      }
    : undefined;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New idea</h1>
        {note && (
          <p className="text-sm text-muted-foreground">
            From a note in <span className="text-foreground">{note.book.title}</span>.
            Restate it as an idea in your own words; the note will be linked as
            support.
          </p>
        )}
      </div>

      {note && (
        <blockquote className="rounded-xl border-l-4 bg-muted/40 p-4">
          <Markdown>{note.body}</Markdown>
        </blockquote>
      )}

      <IdeaForm
        action={createIdeaAction}
        initialValues={initialValues}
        books={books}
        lockedBookIds={note ? [note.bookId] : []}
        submitLabel="Save idea"
        cancelHref={note ? `/books/${note.bookId}#note-${note.id}` : "/ideas"}
      />
    </div>
  );
}
