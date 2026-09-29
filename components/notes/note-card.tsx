import Link from "next/link";

import { deleteNoteAction } from "@/app/books/[id]/notes/actions";
import { ConfirmButton } from "@/components/confirm-button";
import { Markdown } from "@/components/markdown";
import { buttonVariants } from "@/components/ui/button";
import { formatTimestampDate } from "@/lib/dates";
import type { Note } from "@/lib/generated/prisma/client";

export function NoteCard({ note }: { note: Note }) {
  return (
    // The id lets the edit page link straight back to this note (#note-…).
    <article id={`note-${note.id}`} className="grid gap-2 rounded-xl border p-4">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {note.title && <h3 className="font-medium">{note.title}</h3>}
        {note.page && (
          <span className="text-xs font-medium text-muted-foreground">
            p. {note.page}
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          {formatTimestampDate(note.createdAt)}
        </span>
      </header>

      <Markdown>{note.body}</Markdown>

      <div className="flex gap-2">
        <Link
          href={`/books/${note.bookId}/notes/${note.id}/edit`}
          className={buttonVariants({ variant: "ghost", size: "xs" })}
        >
          Edit
        </Link>
        <ConfirmButton
          action={deleteNoteAction.bind(null, note.bookId, note.id)}
          message="Delete this note? This can't be undone."
          size="xs"
        >
          Delete
        </ConfirmButton>
      </div>
    </article>
  );
}
