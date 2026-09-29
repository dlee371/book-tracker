import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";

import { createNoteAction } from "@/app/books/[id]/notes/actions";
import { BookCover } from "@/components/books/book-cover";
import { RatingStars } from "@/components/books/rating-stars";
import { IdeaCard } from "@/components/ideas/idea-card";
import { NoteCard } from "@/components/notes/note-card";
import { NoteForm } from "@/components/notes/note-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { STATUS_LABELS } from "@/lib/books";
import { getCurrentUserId } from "@/lib/current-user";
import { formatCalendarDate } from "@/lib/dates";
import type { Book } from "@/lib/generated/prisma/client";
import { getBook } from "@/lib/services/books";
import { listIdeasForBook } from "@/lib/services/ideas";
import { listNotesForBook } from "@/lib/services/notes";

export async function generateMetadata({
  params,
}: PageProps<"/books/[id]">): Promise<Metadata> {
  const { id } = await params;
  const book = await getBook(await getCurrentUserId(), id);
  return { title: book ? `${book.title} · Book Tracker` : "Book Tracker" };
}

export default async function BookPage({ params }: PageProps<"/books/[id]">) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const [book, notes, ideas] = await Promise.all([
    getBook(userId, id),
    listNotesForBook(userId, id),
    listIdeasForBook(userId, id),
  ]);
  if (!book) notFound();

  return (
    <div className="grid gap-8">
      <Link
        href="/books"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> Library
      </Link>

      <BookHeader book={book} />

      {book.description && (
        <p className="whitespace-pre-line text-sm text-muted-foreground">
          {book.description}
        </p>
      )}

      {book.review && (
        <section className="grid gap-2">
          <h2 className="font-semibold">Your review</h2>
          <p className="whitespace-pre-line">{book.review}</p>
        </section>
      )}

      {ideas.length > 0 && (
        <section className="grid gap-3">
          <h2 className="font-semibold">
            Ideas from this book{" "}
            <span className="font-normal text-muted-foreground">{ideas.length}</span>
          </h2>
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </section>
      )}

      <section className="grid gap-4">
        <h2 className="font-semibold">
          Notes{" "}
          <span className="font-normal text-muted-foreground">{notes.length}</span>
        </h2>
        <div className="rounded-xl bg-muted/40 p-4">
          <NoteForm
            action={createNoteAction.bind(null, book.id)}
            submitLabel="Add note"
          />
        </div>
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No notes yet. What&apos;s worth remembering from this book?
          </p>
        ) : (
          notes.map((note) => <NoteCard key={note.id} note={note} />)
        )}
      </section>
    </div>
  );
}

function BookHeader({ book }: { book: Book }) {
  const details = [
    book.genre,
    book.publicationYear?.toString(),
    book.pageCount && `${book.pageCount} pages`,
  ].filter(Boolean);
  const dates = [
    book.startedAt && `Started ${formatCalendarDate(book.startedAt)}`,
    book.finishedAt && `Finished ${formatCalendarDate(book.finishedAt)}`,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <BookCover url={book.coverUrl} title={book.title} size="lg" />
      <div className="grid flex-1 content-start gap-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {book.title}
            </h1>
            <p className="text-muted-foreground">{book.author}</p>
          </div>
          <Link
            href={`/books/${book.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <PencilIcon /> Edit
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Badge variant={book.status === "READING" ? "default" : "secondary"}>
            {STATUS_LABELS[book.status]}
          </Badge>
          {book.rating && <RatingStars rating={book.rating} />}
        </div>
        {details.length > 0 && (
          <p className="text-sm text-muted-foreground">{details.join(" · ")}</p>
        )}
        {dates.length > 0 && (
          <p className="text-sm text-muted-foreground">{dates.join(" · ")}</p>
        )}
      </div>
    </div>
  );
}
