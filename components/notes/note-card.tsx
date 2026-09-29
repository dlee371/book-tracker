import Link from "next/link";

import { deleteNoteAction } from "@/app/books/[id]/notes/actions";
import { ConfirmButton } from "@/components/confirm-button";
import { Markdown } from "@/components/markdown";
import { TagList } from "@/components/tags/tag-list";
import { buttonVariants } from "@/components/ui/button";
import { formatTimestampDate } from "@/lib/dates";
import type { NoteWithDetails } from "@/lib/services/notes";

export function NoteCard({
  note,
  showBook = false,
}: {
  note: NoteWithDetails;
  // On pages that mix books (e.g. a tag page), say which book it's from.
  showBook?: boolean;
}) {
  return (
    // The id lets the edit page link straight back to this note (#note-…).
    <article id={`note-${note.id}`} className="grid gap-2 rounded-xl border p-4">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {note.title && <h3 className="font-medium">{note.title}</h3>}
        {showBook && (
          <Link
            href={`/books/${note.book.id}#note-${note.id}`}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {note.book.title}
          </Link>
        )}
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

      <TagList names={note.tags.map(({ tag }) => tag.name)} />

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
