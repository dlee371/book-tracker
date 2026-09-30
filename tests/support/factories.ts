import { randomUUID } from "node:crypto";

import { afterAll } from "vitest";

import { db } from "@/lib/db";
import { createBook } from "@/lib/services/books";
import type { BookInput } from "@/lib/validation/book";

// Each test file creates its own users and deletes them at the end
// (cascades remove everything they own), so tests never see each other's
// data and can run in parallel.
const createdUserIds: string[] = [];

afterAll(async () => {
  await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
});

export async function createUser(name = "Test Reader") {
  const user = await db.user.create({
    data: { name, email: `${randomUUID()}@example.test` },
  });
  createdUserIds.push(user.id);
  return user;
}

export function bookInput(overrides: Partial<BookInput> = {}): BookInput {
  return {
    title: "A Book",
    author: "Some Author",
    coverUrl: null,
    description: null,
    genre: null,
    publicationYear: null,
    pageCount: null,
    status: "WANT_TO_READ",
    startedAt: null,
    finishedAt: null,
    rating: null,
    review: null,
    ...overrides,
  };
}

export function addBook(userId: string, overrides: Partial<BookInput> = {}) {
  return createBook(userId, bookInput(overrides));
}
