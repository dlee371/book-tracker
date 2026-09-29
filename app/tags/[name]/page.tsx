import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { NoteCard } from "@/components/notes/note-card";
import { getCurrentUserId } from "@/lib/current-user";
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
  const notes = await listNotesForTag(userId, tagName);

  // Unused tags are deleted, so no notes means no such tag.
  if (notes.length === 0) notFound();

  const bookCount = new Set(notes.map((note) => note.bookId)).size;

  return (
    <div className="grid gap-6">
      <Link
        href="/tags"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> All tags
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">#{tagName}</h1>
        <p className="text-sm text-muted-foreground">
          {notes.length} {notes.length === 1 ? "note" : "notes"} from{" "}
          {bookCount} {bookCount === 1 ? "book" : "books"}
        </p>
      </div>
      <div className="grid gap-3">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} showBook />
        ))}
      </div>
    </div>
  );
}
