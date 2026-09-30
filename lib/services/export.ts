import "server-only";

import { db } from "@/lib/db";
import { formatCalendarDate } from "@/lib/dates";
import { STATUS_LABELS } from "@/lib/books";
import { RELATIONS } from "@/lib/idea-links";

// Everything a user owns, for download. Your knowledge base should never be
// locked in: JSON for re-importing or scripting, Markdown for reading.

export async function exportData(userId: string) {
  const [user, books, ideas, connections] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, email: true, createdAt: true },
    }),
    db.book.findMany({
      where: { userId },
      orderBy: [{ authorSort: "asc" }, { title: "asc" }],
      omit: { userId: true, authorSort: true },
      include: {
        notes: {
          omit: { userId: true, bookId: true },
          include: { tags: { select: { tag: { select: { name: true } } } } },
          orderBy: [{ page: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
        },
      },
    }),
    db.idea.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      omit: { userId: true },
      include: {
        sources: { select: { bookId: true } },
        notes: { select: { noteId: true } },
        tags: { select: { tag: { select: { name: true } } } },
      },
    }),
    db.ideaLink.findMany({
      where: { userId },
      omit: { userId: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Flatten join-table rows into plain lists for a friendlier file.
  return {
    exportedAt: new Date().toISOString(),
    user,
    books: books.map(({ notes, ...book }) => ({
      ...book,
      notes: notes.map(({ tags, ...note }) => ({
        ...note,
        tags: tags.map(({ tag }) => tag.name),
      })),
    })),
    ideas: ideas.map(({ sources, notes, tags, ...idea }) => ({
      ...idea,
      sourceBookIds: sources.map((s) => s.bookId),
      supportingNoteIds: notes.map((n) => n.noteId),
      tags: tags.map(({ tag }) => tag.name),
    })),
    connections,
  };
}

type ExportData = Awaited<ReturnType<typeof exportData>>;

// One readable Markdown document: books (with notes), then ideas.
export function toMarkdown(data: ExportData): string {
  const lines: string[] = [];
  const out = (...more: string[]) => lines.push(...more);
  const bookTitle = new Map(data.books.map((b) => [b.id, b.title]));
  const ideaTitle = new Map(data.ideas.map((i) => [i.id, i.title]));
  const tagList = (tags: string[]) => (tags.length ? tags.map((t) => `#${t.replace(/ /g, "-")}`).join(" ") : "");

  out(`# Book Tracker export`, "", `Exported ${data.exportedAt} for ${data.user.name}.`, "");

  out(`## Books (${data.books.length})`, "");
  for (const book of data.books) {
    out(`### ${book.title}`, "", `*${book.author}* · ${STATUS_LABELS[book.status]}`);
    const details = [
      book.genre,
      book.publicationYear?.toString(),
      book.rating && `${"★".repeat(book.rating)}`,
      book.startedAt && `started ${formatCalendarDate(book.startedAt)}`,
      book.finishedAt && `finished ${formatCalendarDate(book.finishedAt)}`,
    ].filter(Boolean);
    if (details.length) out(details.join(" · "));
    out("");
    if (book.review) out("**Review:**", "", book.review, "");
    for (const note of book.notes) {
      const heading = [note.title, note.page && `p. ${note.page}`].filter(Boolean).join(" · ");
      out(`#### ${heading || "Note"}`, "", note.body, "");
      if (note.tags.length) out(tagList(note.tags), "");
    }
  }

  out(`## Ideas (${data.ideas.length})`, "");
  for (const idea of data.ideas) {
    out(`### ${idea.title}`, "");
    if (idea.explanation) out(idea.explanation, "");
    const sources = idea.sourceBookIds.map((id) => bookTitle.get(id)).filter(Boolean);
    if (sources.length) out(`Sources: ${sources.join(", ")}`, "");
    if (idea.tags.length) out(tagList(idea.tags), "");
    const links = data.connections.filter((c) => c.fromIdeaId === idea.id);
    for (const link of links) {
      const relation = Object.values(RELATIONS).find((r) => r.type === link.type && !r.reversed);
      out(`- ${relation?.label ?? link.type} **${ideaTitle.get(link.toIdeaId)}**${link.comment ? `: ${link.comment}` : ""}`);
    }
    if (links.length) out("");
  }

  return lines.join("\n");
}
