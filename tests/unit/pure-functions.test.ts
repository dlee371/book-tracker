// Pure functions: no database, run in milliseconds.
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { authorSortKey } from "@/lib/author-sort";
import { connectionGroup } from "@/lib/idea-links";
import { libraryHref, parseLibraryQuery } from "@/lib/library-query";
import { toPrefixQuery } from "@/lib/services/search";
import { normalizeTagName, parseTagList, tagNameFromParam } from "@/lib/tags";
import { bookSchema } from "@/lib/validation/book";

describe("authorSortKey", () => {
  it.each([
    ["James Clear", "Clear, James"],
    ["Plato", "Plato"],
    ["Viktor E. Frankl", "Frankl, Viktor E."],
    ["David Thomas & Andrew Hunt", "Thomas, David"],
    ["Richard Thaler and Cass Sunstein", "Thaler, Richard"],
    ["Sandra Alexander", "Alexander, Sandra"], // "and" inside a word isn't a separator
  ])("%s -> %s", (author, key) => {
    expect(authorSortKey(author)).toBe(key);
  });
});

describe("tags", () => {
  it("normalizes case, whitespace and a leading #", () => {
    expect(normalizeTagName("  #Decision   Making ")).toBe("decision making");
  });

  it("parses a comma-separated list, dropping empties and duplicates", () => {
    expect(parseTagList("Focus, #focus,  Deep   Work , habits,,")).toEqual([
      "focus",
      "deep work",
      "habits",
    ]);
  });

  it("decodes URL params once, and rejects malformed ones", () => {
    expect(tagNameFromParam("decision%20making")).toBe("decision making");
    expect(tagNameFromParam("%E0")).toBeNull();
  });
});

describe("bookSchema", () => {
  const base = {
    title: " Dune ", author: "Frank Herbert", status: "READING", coverUrl: "",
    description: "", genre: "", publicationYear: "", pageCount: "",
    startedAt: "", finishedAt: "", rating: "", review: "",
  };
  const errors = (input: object) => {
    const result = bookSchema.safeParse({ ...base, ...input });
    return result.success ? null : z.flattenError(result.error).fieldErrors;
  };

  it("trims text and turns empty fields into null", () => {
    const parsed = bookSchema.parse(base);
    expect(parsed.title).toBe("Dune");
    expect(parsed.pageCount).toBeNull();
    expect(parsed.coverUrl).toBeNull();
  });

  it("converts numbers and dates from form strings", () => {
    const parsed = bookSchema.parse({ ...base, pageCount: "412", startedAt: "2026-01-04" });
    expect(parsed.pageCount).toBe(412);
    expect(parsed.startedAt).toEqual(new Date("2026-01-04T00:00:00Z"));
  });

  it("rejects javascript: cover URLs", () => {
    expect(errors({ coverUrl: "javascript:alert(1)" })?.coverUrl).toBeDefined();
  });

  it("rejects a finish date before the start date", () => {
    expect(errors({ startedAt: "2026-02-01", finishedAt: "2026-01-01" })?.finishedAt).toEqual([
      "Finish date can't be before start date",
    ]);
  });
});

describe("library query", () => {
  it("falls back to defaults for invalid values", () => {
    expect(parseLibraryQuery({ sort: "banana", status: "NOPE" })).toEqual({
      q: "",
      status: null,
      sort: "added",
    });
  });

  it("builds short URLs, leaving out defaults", () => {
    const query = parseLibraryQuery({ q: "habits", status: "READING" });
    expect(libraryHref(query)).toBe("/books?q=habits&status=READING");
    expect(libraryHref(query, { q: "", status: null })).toBe("/books");
  });
});

describe("toPrefixQuery", () => {
  it("makes every word a required prefix", () => {
    expect(toPrefixQuery("Hab env!")).toBe("hab:* & env:*");
  });

  it("strips tsquery syntax so user input can't break the query", () => {
    expect(toPrefixQuery("a & b | !cc:* ('x')")).toBe("cc:*");
    expect(toPrefixQuery("'; DROP TABLE notes; --")).toBe("drop:* & table:* & notes:*");
  });

  it("returns null when nothing searchable is left", () => {
    expect(toPrefixQuery("!!! a")).toBeNull();
  });
});

describe("connectionGroup", () => {
  it("describes directional links from each side", () => {
    const link = { type: "SUPPORTS" as const, fromIdeaId: "a" };
    expect(connectionGroup(link, "a")).toBe("Supports");
    expect(connectionGroup(link, "b")).toBe("Supported by");
  });

  it("describes symmetric links the same from both sides", () => {
    const link = { type: "CONTRADICTS" as const, fromIdeaId: "a" };
    expect(connectionGroup(link, "a")).toBe("Contradicts");
    expect(connectionGroup(link, "b")).toBe("Contradicts");
  });
});
