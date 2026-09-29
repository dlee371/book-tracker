import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { IdeaCard } from "@/components/ideas/idea-card";
import { NoteCard } from "@/components/notes/note-card";
import { getCurrentUserId } from "@/lib/current-user";
import { listIdeas } from "@/lib/services/ideas";
import { listNotesForTag } from "@/lib/services/notes";
import { tagNameFromParam } from "@/lib/tags";

export async function generateMetadata({
  params,
}: PageProps<"/tags/[name]">): Promise<Metadata> {
  const tagName = tagNameFromParam((await params).name);
  return { title: tagName ? `#${tagName} · Book Tracker` : "Book Tracker" };
}

export default async function TagPage({ params }: PageProps<"/tags/[name]">) {
  const tagName = tagNameFromParam((await params).name);
  if (!tagName) notFound();

  const userId = await getCurrentUserId();
  const [ideas, notes] = await Promise.all([
    listIdeas(userId, { tag: tagName }),
    listNotesForTag(userId, tagName),
  ]);

  // Unused tags are deleted, so nothing tagged means no such tag.
  if (ideas.length === 0 && notes.length === 0) notFound();

  const bookCount = new Set(notes.map((note) => note.bookId)).size;

  return (
    <div className="grid gap-8">
      <Link
        href="/tags"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> All tags
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">#{tagName}</h1>

      {ideas.length > 0 && (
        <section className="grid gap-3">
          <h2 className="font-semibold">
            Ideas{" "}
            <span className="font-normal text-muted-foreground">{ideas.length}</span>
          </h2>
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </section>
      )}

      {notes.length > 0 && (
        <section className="grid gap-3">
          <h2 className="font-semibold">
            Notes{" "}
            <span className="font-normal text-muted-foreground">
              {notes.length} from {bookCount} {bookCount === 1 ? "book" : "books"}
            </span>
          </h2>
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} showBook />
          ))}
        </section>
      )}
    </div>
  );
}
