// Rules the data model relies on: derived fields, transactions, cleanup and
// database constraints.
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { deleteBook, listBooks, updateBook } from "@/lib/services/books";
import { connectIdeas, listConnections } from "@/lib/services/idea-links";
import { createIdea, getIdea, linkNoteToIdea, unlinkNoteFromIdea, updateIdea } from "@/lib/services/ideas";
import { createNote, updateNote } from "@/lib/services/notes";
import { listTagsWithCounts } from "@/lib/services/tags";
import { addBook, bookInput, createUser } from "../support/factories";

const note = (body: string, tags: string[] = []) => ({ title: null, body, page: null, tags });
const idea = (title: string, extra = {}) => ({
  title, explanation: null, tags: [] as string[], bookIds: [] as string[], noteIds: [] as string[], ...extra,
});

let user: { id: string };
beforeAll(async () => {
  user = await createUser();
});

describe("books", () => {
  it("keeps authorSort in sync with author on create and update", async () => {
    const book = await addBook(user.id, { author: "Richard Thaler and Cass Sunstein" });
    expect(book.authorSort).toBe("Thaler, Richard");
    await updateBook(user.id, book.id, bookInput({ author: "Cass Sunstein & Richard Thaler" }));
    expect((await db.book.findUniqueOrThrow({ where: { id: book.id } })).authorSort).toBe("Sunstein, Cass");
  });

  it("sorts by rating with unrated books last", async () => {
    const u = await createUser();
    await addBook(u.id, { title: "Unrated" });
    await addBook(u.id, { title: "Three", rating: 3 });
    await addBook(u.id, { title: "Five", rating: 5 });
    const books = await listBooks(u.id, { q: "", status: null, sort: "rating" });
    expect(books.map((b) => b.title)).toEqual(["Five", "Three", "Unrated"]);
  });
});

describe("tags", () => {
  it("reuses existing tags and deletes ones nothing uses anymore", async () => {
    const u = await createUser();
    const book = await addBook(u.id);
    const first = (await createNote(u.id, book.id, note("one", ["Focus", "#focus", "habits"])))!;
    await createNote(u.id, book.id, note("two", ["habits"]));

    expect(await listTagsWithCounts(u.id)).toEqual([
      { name: "habits", noteCount: 2, ideaCount: 0 },
      { name: "focus", noteCount: 1, ideaCount: 0 },
    ]);

    await updateNote(u.id, first.id, note("one", ["habits"]));
    expect((await listTagsWithCounts(u.id)).map((t) => t.name)).toEqual(["habits"]);

    await deleteBook(u.id, book.id); // cascades to notes, then cleans up tags
    expect(await listTagsWithCounts(u.id)).toEqual([]);
  });

  it("rolls back the whole note update if saving a tag fails", async () => {
    const book = await addBook(user.id);
    const saved = (await createNote(user.id, book.id, note("original", ["kept"])))!;
    // Postgres rejects the NUL byte, after the note text changed and the old
    // tag links were removed. The transaction must undo both.
    await expect(updateNote(user.id, saved.id, note("CHANGED", ["bad\u0000tag"]))).rejects.toThrow();

    const after = await db.note.findUniqueOrThrow({
      where: { id: saved.id },
      include: { tags: { include: { tag: true } } },
    });
    expect(after.body).toBe("original");
    expect(after.tags.map((t) => t.tag.name)).toEqual(["kept"]);
  });
});

describe("ideas", () => {
  it("makes every supporting note's book a source, and keeps it on edit", async () => {
    const a = await addBook(user.id, { title: "Book A" });
    const b = await addBook(user.id, { title: "Book B" });
    const c = await addBook(user.id, { title: "Book C" });
    const noteA = (await createNote(user.id, a.id, note("from A")))!;
    const noteB = (await createNote(user.id, b.id, note("from B")))!;

    const created = await createIdea(user.id, idea("Shared idea", { noteIds: [noteA.id] }));
    await linkNoteToIdea(user.id, created.id, noteB.id);
    // An edit that only checks Book C still keeps A and B (they have notes).
    await updateIdea(user.id, created.id, idea("Shared idea", { bookIds: [c.id] }));

    const sources = async () =>
      (await getIdea(user.id, created.id))!.sources.map((s) => s.book.title).sort();
    expect(await sources()).toEqual(["Book A", "Book B", "Book C"]);

    // Unlinking a note keeps its book as a source; the next edit can drop it.
    await unlinkNoteFromIdea(user.id, created.id, noteB.id);
    expect(await sources()).toEqual(["Book A", "Book B", "Book C"]);
    await updateIdea(user.id, created.id, idea("Shared idea", { bookIds: [] }));
    expect(await sources()).toEqual(["Book A"]);
  });

  it("survives deleting its only source book", async () => {
    const book = await addBook(user.id);
    const created = await createIdea(user.id, idea("Standalone", { bookIds: [book.id] }));
    await deleteBook(user.id, book.id);
    expect((await getIdea(user.id, created.id))?.sources).toEqual([]);
  });
});

describe("connections", () => {
  it("treats symmetric links as the same in either direction", async () => {
    const x = await createIdea(user.id, idea("X"));
    const y = await createIdea(user.id, idea("Y"));
    expect((await connectIdeas(user.id, x.id, { relation: "CONTRADICTS", targetIdeaId: y.id, comment: null })).ok).toBe(true);
    const again = await connectIdeas(user.id, y.id, { relation: "CONTRADICTS", targetIdeaId: x.id, comment: null });
    expect(again).toEqual({ ok: false, error: "These ideas are already connected that way." });
    // Directional links in both directions are different facts, so allowed.
    expect((await connectIdeas(user.id, x.id, { relation: "SUPPORTS", targetIdeaId: y.id, comment: null })).ok).toBe(true);
    expect((await connectIdeas(user.id, x.id, { relation: "SUPPORTED_BY", targetIdeaId: y.id, comment: null })).ok).toBe(true);
    expect(await listConnections(user.id, x.id)).toHaveLength(3);
  });

  it("rejects self-links in the service and in the database itself", async () => {
    const x = await createIdea(user.id, idea("Self"));
    expect((await connectIdeas(user.id, x.id, { relation: "RELATED", targetIdeaId: x.id, comment: null })).ok).toBe(false);
    await expect(
      db.$executeRaw`INSERT INTO idea_links (id, "userId", "fromIdeaId", "toIdeaId", type)
                     VALUES ('self-link', ${user.id}, ${x.id}, ${x.id}, 'RELATED')`,
    ).rejects.toThrow(/idea_links_not_self/);
  });
});
