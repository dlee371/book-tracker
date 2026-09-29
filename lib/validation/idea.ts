import { z } from "zod";

import { optional } from "@/lib/validation/helpers";
import { tagListSchema } from "@/lib/validation/note";

const idList = z.array(z.string().min(1).max(100)).max(200);

export const ideaSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "State the idea in a sentence")
    .max(300),
  explanation: optional(z.string().trim().max(20_000)),
  tags: tagListSchema,
  // Checked source books (checkboxes named "bookIds").
  bookIds: idList.default([]),
  // Supporting notes to link when creating (hidden inputs named "noteIds").
  noteIds: idList.default([]),
});

export type IdeaInput = z.infer<typeof ideaSchema>;
