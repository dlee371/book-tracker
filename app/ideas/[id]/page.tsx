import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, LightbulbIcon, PencilIcon } from "lucide-react";

import { deleteIdeaAction, unlinkNoteFromIdeaAction } from "@/app/ideas/actions";
import { BookCover } from "@/components/books/book-cover";
import { ConfirmButton } from "@/components/confirm-button";
import { Markdown } from "@/components/markdown";
import { TagList } from "@/components/tags/tag-list";
import { Button, buttonVariants } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/current-user";
import { formatTimestampDate } from "@/lib/dates";
import { getIdea } from "@/lib/services/ideas";

export async function generateMetadata({
  params,
}: PageProps<"/ideas/[id]">): Promise<Metadata> {
  const idea = await getIdea(await getCurrentUserId(), (await params).id);
  return { title: idea ? `${idea.title} · Book Tracker` : "Book Tracker" };
}

export default async function IdeaPage({ params }: PageProps<"/ideas/[id]">) {
  const { id } = await params;
  const idea = await getIdea(await getCurrentUserId(), id);
  if (!idea) notFound();

  return (
    <div className="grid gap-8">
      <Link
        href="/ideas"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> Ideas
      </Link>

      <header className="grid gap-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="flex items-start gap-2 text-2xl font-semibold tracking-tight">
            <LightbulbIcon className="mt-1.5 size-5 shrink-0 text-amber-500" />
            {idea.title}
          </h1>
          <Link
            href={`/ideas/${idea.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <PencilIcon /> Edit
          </Link>
        </div>
        <TagList names={idea.tags.map(({ tag }) => tag.name)} />
        <p className="text-xs text-muted-foreground">
          Captured {formatTimestampDate(idea.createdAt)}
        </p>
      </header>

      {idea.explanation && <Markdown>{idea.explanation}</Markdown>}

      <section className="grid gap-3">
        <h2 className="font-semibold">
          Sources{" "}
          <span className="font-normal text-muted-foreground">
            {idea.sources.length}
          </span>
        </h2>
        {idea.sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Not linked to any book. Edit the idea to add sources.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {idea.sources.map(({ book }) => (
              <li key={book.id}>
                <Link
                  href={`/books/${book.id}`}
                  className="flex items-center gap-3 rounded-xl border p-2 transition-colors hover:bg-muted/50"
                >
                  <BookCover url={book.coverUrl} title={book.title} />
                  <span className="grid">
                    <span className="font-medium">{book.title}</span>
                    <span className="text-sm text-muted-foreground">{book.author}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="font-semibold">
          Supporting notes{" "}
          <span className="font-normal text-muted-foreground">
            {idea.notes.length}
          </span>
        </h2>
        {idea.notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            None yet. On any note, choose “Add to idea” to link it here.
          </p>
        ) : (
          idea.notes.map(({ note }) => (
            <blockquote key={note.id} className="grid gap-2 rounded-xl border-l-4 bg-muted/40 p-4">
              <Markdown>{note.body}</Markdown>
              <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <Link
                  href={`/books/${note.book.id}#note-${note.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {note.book.title}
                  {note.page && `, p. ${note.page}`}
                </Link>
                <form action={unlinkNoteFromIdeaAction.bind(null, idea.id, note.id)}>
                  <Button type="submit" variant="ghost" size="xs">
                    Unlink
                  </Button>
                </form>
              </footer>
            </blockquote>
          ))
        )}
      </section>

      <div className="border-t pt-6">
        <ConfirmButton
          action={deleteIdeaAction.bind(null, idea.id)}
          message="Delete this idea? Its notes and books are not affected."
        >
          Delete idea
        </ConfirmButton>
      </div>
    </div>
  );
}
