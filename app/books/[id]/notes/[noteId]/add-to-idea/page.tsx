import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LightbulbIcon, SearchIcon } from "lucide-react";

import { linkNoteToIdeaAction } from "@/app/ideas/actions";
import { Markdown } from "@/components/markdown";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUserId } from "@/lib/current-user";
import { listIdeas } from "@/lib/services/ideas";
import { getNote } from "@/lib/services/notes";

export const metadata: Metadata = { title: "Add note to idea · Book Tracker" };

// Links a note to an existing idea as support. This is how one idea gathers
// evidence from several books.
export default async function AddToIdeaPage({
  params,
  searchParams,
}: PageProps<"/books/[id]/notes/[noteId]/add-to-idea">) {
  const { id: bookId, noteId } = await params;
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const userId = await getCurrentUserId();

  const [note, ideas] = await Promise.all([
    getNote(userId, noteId),
    listIdeas(userId, { q: query }),
  ]);
  if (!note || note.bookId !== bookId) notFound();

  const linkedIdeaIds = new Set(note.ideas.map(({ idea }) => idea.id));
  const newIdeaHref = `/ideas/new?fromNote=${note.id}`;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add note to an idea</h1>
        <p className="text-sm text-muted-foreground">
          The note will be linked as support, and{" "}
          <span className="text-foreground">{note.book.title}</span> added as a
          source.
        </p>
      </div>

      <blockquote className="rounded-xl border-l-4 bg-muted/40 p-4">
        <Markdown>{note.body}</Markdown>
      </blockquote>

      <Form
        action={`/books/${bookId}/notes/${note.id}/add-to-idea`}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            // Remount when the query changes so the box shows the current one.
            key={query}
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search your ideas"
            aria-label="Search your ideas"
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </Form>

      {ideas.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {query ? "No ideas match. " : "You don't have any ideas yet. "}
          <Link href={newIdeaHref} className="text-foreground underline underline-offset-4">
            Turn this note into a new idea
          </Link>
        </div>
      ) : (
        <ul className="grid gap-2">
          {ideas.map((idea) => (
            <li key={idea.id} className="flex items-center gap-3 rounded-xl border p-3">
              <LightbulbIcon className="size-4 shrink-0 text-amber-500" />
              <div className="grid flex-1">
                <span className="font-medium">{idea.title}</span>
                <span className="text-xs text-muted-foreground">
                  {idea.sources.map(({ book }) => book.title).join(", ") || "No source books"}
                </span>
              </div>
              {linkedIdeaIds.has(idea.id) ? (
                <span className="text-xs text-muted-foreground">Already linked</span>
              ) : (
                <form action={linkNoteToIdeaAction.bind(null, note.id, idea.id)}>
                  <Button type="submit" size="sm">
                    Add here
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`/books/${bookId}#note-${note.id}`}
        className={buttonVariants({ variant: "ghost", className: "w-fit" })}
      >
        Cancel
      </Link>
    </div>
  );
}
