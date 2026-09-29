import { z } from "zod";

import { optional } from "@/lib/validation/helpers";

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
});

export type NoteInput = z.infer<typeof noteSchema>;
