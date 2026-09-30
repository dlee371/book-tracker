import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  LightbulbIcon,
  NetworkIcon,
  PencilIcon,
  PlusIcon,
} from "lucide-react";

import {
  deleteIdeaAction,
  deleteIdeaLinkAction,
  unlinkNoteFromIdeaAction,
} from "@/app/ideas/actions";
import { BookCover } from "@/components/books/book-cover";
import { ConfirmButton } from "@/components/confirm-button";
import { LocalDate } from "@/components/local-date";
import { Markdown } from "@/components/markdown";
import { TagList } from "@/components/tags/tag-list";
import { Button, buttonVariants } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/current-user";
import { CONNECTION_GROUPS, connectionGroup } from "@/lib/idea-links";
import { listConnections, type Connection } from "@/lib/services/idea-links";
import { getIdea } from "@/lib/services/ideas";

export async function generateMetadata({
  params,
}: PageProps<"/ideas/[id]">): Promise<Metadata> {
  const idea = await getIdea(await getCurrentUserId(), (await params).id);
  return { title: idea ? `${idea.title} · Book Tracker` : "Book Tracker" };
}

export default async function IdeaPage({ params }: PageProps<"/ideas/[id]">) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const [idea, connections] = await Promise.all([
    getIdea(userId, id),
    listConnections(userId, id),
  ]);
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
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/graph?idea=${idea.id}`}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <NetworkIcon /> View in graph
            </Link>
            <Link
              href={`/ideas/${idea.id}/edit`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <PencilIcon /> Edit
            </Link>
          </div>
        </div>
        <TagList names={idea.tags.map(({ tag }) => tag.name)} />
        <p className="text-xs text-muted-foreground">
          Captured <LocalDate date={idea.createdAt} />
        </p>
      </header>

      {idea.explanation && <Markdown>{idea.explanation}</Markdown>}

      <Connections ideaId={idea.id} connections={connections} />

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

function Connections({
  ideaId,
  connections,
}: {
  ideaId: string;
  connections: Connection[];
}) {
  // Group by heading ("Supports", "Contradicts", …) as seen from this idea.
  const groups = CONNECTION_GROUPS.map((group) => ({
    group,
    links: connections.filter((link) => connectionGroup(link, ideaId) === group),
  })).filter(({ links }) => links.length > 0);

  return (
    <section id="connections" className="grid gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-semibold">
          Connections{" "}
          <span className="font-normal text-muted-foreground">
            {connections.length}
          </span>
        </h2>
        <Link
          href={`/ideas/${ideaId}/connect`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <PlusIcon /> Connect
        </Link>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Not connected to other ideas yet. Does another idea support, extend or
          contradict this one?
        </p>
      ) : (
        groups.map(({ group, links }) => (
          <div key={group} className="grid gap-2">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {group}
            </h3>
            <ul className="grid gap-2">
              {links.map((link) => (
                <li key={link.id} className="flex items-start gap-3 rounded-xl border p-3">
                  <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  <div className="grid flex-1 gap-1">
                    <Link
                      href={`/ideas/${link.otherIdea.id}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {link.otherIdea.title}
                    </Link>
                    {link.comment && (
                      <p className="text-sm text-muted-foreground">{link.comment}</p>
                    )}
                  </div>
                  <form action={deleteIdeaLinkAction.bind(null, link.id)}>
                    <Button type="submit" variant="ghost" size="xs">
                      Remove
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
