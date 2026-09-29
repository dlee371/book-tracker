import type { Metadata } from "next";
import Link from "next/link";

import { GraphView } from "@/components/graph/graph-view";
import { getCurrentUserId } from "@/lib/current-user";
import { getGraph } from "@/lib/services/graph";
import { getIdea } from "@/lib/services/ideas";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Graph · Book Tracker" };

// /graph                 everything
// /graph?idea=<id>       focus: that idea and what's within 2 steps of it
// ...&tags=0             hide tags
export default async function GraphPage({ searchParams }: PageProps<"/graph">) {
  const params = await searchParams;
  const focusId = typeof params.idea === "string" ? params.idea : undefined;
  const includeTags = params.tags !== "0";
  const userId = await getCurrentUserId();

  const [graph, focusIdea] = await Promise.all([
    getGraph(userId, { focusIdeaId: focusId, includeTags }),
    focusId ? getIdea(userId, focusId) : null,
  ]);

  const href = (changes: { idea?: string | null; tags?: boolean }) => {
    const search = new URLSearchParams();
    const idea = changes.idea === undefined ? focusId : changes.idea;
    const tags = changes.tags ?? includeTags;
    if (idea) search.set("idea", idea);
    if (!tags) search.set("tags", "0");
    const qs = search.toString();
    return qs ? `/graph?${qs}` : "/graph";
  };

  const count = (kind: string, one: string, many: string) => {
    const n = graph.nodes.filter((node) => node.kind === kind).length;
    return `${n} ${n === 1 ? one : many}`;
  };
  const links = `${graph.edges.length} ${graph.edges.length === 1 ? "link" : "links"}`;

  return (
    <div className="grid gap-5">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Knowledge graph</h1>
        <p className="text-sm text-muted-foreground">
          {focusIdea ? (
            <>
              Around{" "}
              <Link href={`/ideas/${focusIdea.id}`} className="text-foreground underline underline-offset-4">
                {focusIdea.title}
              </Link>{" "}
              (2 steps) ·{" "}
              <Link href={href({ idea: null })} className="underline underline-offset-4">
                Show everything
              </Link>
            </>
          ) : (
            "How your ideas, books and tags connect. Drag to move, scroll to zoom, click to open."
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href={href({ tags: !includeTags })}
          className={cn(
            "rounded-full border px-3 py-1 transition-colors hover:bg-muted",
            includeTags && "bg-muted",
          )}
          aria-pressed={includeTags}
        >
          {includeTags ? "✓ " : ""}Show tags
        </Link>
        <span className="text-muted-foreground">
          {count("idea", "idea", "ideas")} · {count("book", "book", "books")}
          {includeTags && ` · ${count("tag", "tag", "tags")}`} · {links}
        </span>
      </div>

      {graph.nodes.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="font-medium">{focusId ? "Idea not found" : "Nothing to show yet"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The graph is built from your ideas. Turn a note into an idea to get started.
          </p>
        </div>
      ) : (
        <GraphView key={href({})} graph={graph} />
      )}
    </div>
  );
}
