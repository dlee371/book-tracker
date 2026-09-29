import { z } from "zod";

import { RELATIONS, type Relation } from "@/lib/idea-links";
import { optional } from "@/lib/validation/helpers";

export const connectSchema = z.object({
  relation: z.enum(Object.keys(RELATIONS) as [Relation, ...Relation[]], {
    error: "Choose how the ideas connect",
  }),
  targetIdeaId: z.string({ error: "Choose an idea" }).min(1, "Choose an idea"),
  comment: optional(z.string().trim().max(1000)),
});

export type ConnectInput = z.infer<typeof connectSchema>;
