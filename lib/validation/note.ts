import { z } from "zod";

import { MAX_TAG_LENGTH, MAX_TAGS_PER_ITEM, parseTagList } from "@/lib/tags";
import { optional } from "@/lib/validation/helpers";

// The form sends tags as one comma-separated string; this turns it into a
// clean list of names and checks the limits.
export const tagListSchema = z
  .string()
  .default("")
  .transform(parseTagList)
  .pipe(
    z
      .array(
        z.string().max(MAX_TAG_LENGTH, `Keep each tag under ${MAX_TAG_LENGTH} characters`),
      )
      .max(MAX_TAGS_PER_ITEM, `Use at most ${MAX_TAGS_PER_ITEM} tags`),
  );

export const noteSchema = z.object({
  title: optional(z.string().trim().max(200)),
  body: z.string().trim().min(1, "Write something first").max(50_000),
  page: optional(
    z.coerce
      .number({ error: "Must be a number" })
      .int("Must be a whole number")
      .positive("Must be positive")
      .max(100_000),
  ),
  tags: tagListSchema,
});

export type NoteInput = z.infer<typeof noteSchema>;
