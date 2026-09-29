import { z } from "zod";

import { ReadingStatus } from "@/lib/generated/prisma/enums";
import { optional } from "@/lib/validation/helpers";

const currentYear = new Date().getFullYear();

// "2026-01-04" -> Date at midnight UTC, matching the date-only DB columns.
const calendarDate = z.iso.date().transform((value) => new Date(value));

export const bookSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(300),
    author: z.string().trim().min(1, "Author is required").max(200),
    coverUrl: optional(
      z.url({ protocol: /^https?$/, error: "Must be an http(s) URL" }),
    ),
    description: optional(z.string().trim().max(5000)),
    genre: optional(z.string().trim().max(100)),
    publicationYear: optional(
      z.coerce
        .number({ error: "Must be a year" })
        .int("Must be a whole number")
        .min(0)
        .max(currentYear + 1, "Year is in the future"),
    ),
    pageCount: optional(
      z.coerce
        .number({ error: "Must be a number" })
        .int("Must be a whole number")
        .positive("Must be positive")
        .max(100_000),
    ),
    status: z.enum(ReadingStatus),
    startedAt: optional(calendarDate),
    finishedAt: optional(calendarDate),
    rating: optional(z.coerce.number().int().min(1).max(5)),
    review: optional(z.string().trim().max(20_000)),
  })
  // Rules that involve more than one field go in a refine.
  .refine(
    (book) =>
      !book.startedAt || !book.finishedAt || book.finishedAt >= book.startedAt,
    { message: "Finish date can't be before start date", path: ["finishedAt"] },
  );

// The cleaned-up, typed result of a successful parse.
export type BookInput = z.infer<typeof bookSchema>;
