import Link from "next/link";
import { LightbulbIcon } from "lucide-react";

import { Markdown } from "@/components/markdown";
import { TagList } from "@/components/tags/tag-list";
import type { IdeaWithDetails } from "@/lib/services/ideas";

// Compact summary of an idea for lists.
export function IdeaCard({ idea }: { idea: IdeaWithDetails }) {
  const sources = idea.sources.map(({ book }) => book.title);
  const noteCount = idea.notes.length;

  return (
    <article className="grid gap-2 rounded-xl border p-4">
      <Link
        href={`/ideas/${idea.id}`}
        className="flex items-start gap-2 font-medium underline-offset-4 hover:underline"
      >
        <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
        {idea.title}
      </Link>
      {idea.explanation && (
        <Markdown className="line-clamp-2 text-muted-foreground">
          {idea.explanation}
        </Markdown>
      )}
      <p className="text-xs text-muted-foreground">
        {sources.length > 0 ? `From ${sources.join(", ")}` : "No source books"}
        {noteCount > 0 &&
          ` · ${noteCount} supporting ${noteCount === 1 ? "note" : "notes"}`}
      </p>
      <TagList names={idea.tags.map(({ tag }) => tag.name)} />
    </article>
  );
}
