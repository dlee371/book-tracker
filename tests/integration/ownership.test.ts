// The core security rule: a user can only ever read or change their own data.
// Each service is called by "mallory" with ids that belong to "alice".
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { deleteBook, getBook, listBooks, updateBook } from "@/lib/services/books";
import { connectIdeas, deleteIdeaLink, listConnections } from "@/lib/services/idea-links";
import {
  NotOwnedError,
  createIdea,
  deleteIdea,
  getIdea,
  linkNoteToIdea,
  unlinkNoteFromIdea,
  updateIdea,
} from "@/lib/services/ideas";
import { createNote, deleteNote, getNote, updateNote } from "@/lib/services/notes";
import { searchEverything } from "@/lib/services/search";
import { addBook, bookInput, createUser } from "../support/factories";

const noteInput = { title: null, body: "private thoughts on habits", page: null, tags: ["secret"] };
const ideaInput = { title: "Alice's idea", explanation: null, tags: [], bookIds: [], noteIds: [] };

let alice: { id: string };
let mallory: { id: string };
let aliceBook: { id: string };
let aliceNote: { id: string };
let aliceIdea: { id: string };
let malloryIdea: { id: string };

beforeAll(async () => {
  alice = await createUser("Alice");
  mallory = await createUser("Mallory");
  aliceBook = await addBook(alice.id, { title: "Alice's Habits Book" });
  aliceNote = (await createNote(alice.id, aliceBook.id, noteInput))!;
  aliceIdea = await createIdea(alice.id, { ...ideaInput, noteIds: [aliceNote.id] });
  malloryIdea = await createIdea(mallory.id, { ...ideaInput, title: "Mallory's idea" });
});

describe("books", () => {
  it("can't be read, listed, edited or deleted by another user", async () => {
    expect(await getBook(mallory.id, aliceBook.id)).toBeNull();
    expect(await listBooks(mallory.id, { q: "", status: null, sort: "added" })).toEqual([]);
    expect(await updateBook(mallory.id, aliceBook.id, bookInput({ title: "HACKED" }))).toBe(false);
    expect(await deleteBook(mallory.id, aliceBook.id)).toBe(false);
    expect((await getBook(alice.id, aliceBook.id))?.title).toBe("Alice's Habits Book");
  });
});

describe("notes", () => {
  it("can't be attached to another user's book", async () => {
    expect(await createNote(mallory.id, aliceBook.id, noteInput)).toBeNull();
  });

  it("can't be read, edited or deleted by another user", async () => {
    expect(await getNote(mallory.id, aliceNote.id)).toBeNull();
    expect(await updateNote(mallory.id, aliceNote.id, { ...noteInput, body: "HACKED" })).toBe(false);
    expect(await deleteNote(mallory.id, aliceNote.id)).toBe(false);
    expect((await getNote(alice.id, aliceNote.id))?.body).toBe(noteInput.body);
  });
});

describe("ideas", () => {
  it("can't link another user's books or notes, and roll back completely", async () => {
    const ideasBefore = await db.idea.count({ where: { userId: mallory.id } });
    await expect(createIdea(mallory.id, { ...ideaInput, noteIds: [aliceNote.id] })).rejects.toThrow(NotOwnedError);
    await expect(createIdea(mallory.id, { ...ideaInput, bookIds: [aliceBook.id] })).rejects.toThrow(NotOwnedError);
    expect(await db.idea.count({ where: { userId: mallory.id } })).toBe(ideasBefore);

    // A blocked edit also undoes the other changes in the same save.
    await expect(
      updateIdea(mallory.id, malloryIdea.id, { ...ideaInput, title: "CHANGED", bookIds: [aliceBook.id] }),
    ).rejects.toThrow(NotOwnedError);
    expect((await getIdea(mallory.id, malloryIdea.id))?.title).toBe("Mallory's idea");
  });

  it("can't be read, edited, deleted or linked by another user", async () => {
    expect(await getIdea(mallory.id, aliceIdea.id)).toBeNull();
    expect(await updateIdea(mallory.id, aliceIdea.id, ideaInput)).toBe(false);
    expect(await deleteIdea(mallory.id, aliceIdea.id)).toBe(false);
    expect(await linkNoteToIdea(mallory.id, malloryIdea.id, aliceNote.id)).toBe(false);
    expect(await unlinkNoteFromIdea(mallory.id, aliceIdea.id, aliceNote.id)).toBe(false);
    expect((await getIdea(alice.id, aliceIdea.id))?.notes).toHaveLength(1);
  });
});

describe("connections", () => {
  it("can't connect to, see or remove another user's ideas", async () => {
    const other = await createIdea(alice.id, { ...ideaInput, title: "Alice's second idea" });
    await connectIdeas(alice.id, aliceIdea.id, { relation: "RELATED", targetIdeaId: other.id, comment: null });
    const [link] = await listConnections(alice.id, aliceIdea.id);

    const result = await connectIdeas(mallory.id, malloryIdea.id, {
      relation: "SUPPORTS", targetIdeaId: aliceIdea.id, comment: null,
    });
    expect(result.ok).toBe(false);
    expect(await listConnections(mallory.id, aliceIdea.id)).toEqual([]);
    expect(await deleteIdeaLink(mallory.id, link.id)).toBe(false);
  });
});

describe("search", () => {
  it("never returns another user's books, notes, ideas or tags", async () => {
    const results = await searchEverything(mallory.id, "habits");
    expect(results.books).toEqual([]);
    expect(results.notes).toEqual([]);
    expect(results.tags.map((t) => t.name)).not.toContain("secret");
    expect(results.ideas.map((i) => i.title)).not.toContain("Alice's idea");
  });
});
