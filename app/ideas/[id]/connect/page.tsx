import type { Metadata } from "next";
import Form from "next/form";
import { notFound } from "next/navigation";
import { SearchIcon } from "lucide-react";

import { connectIdeasAction } from "@/app/ideas/actions";
import { ConnectForm } from "@/components/ideas/connect-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUserId } from "@/lib/current-user";
import { getIdea, listIdeas } from "@/lib/services/ideas";

export const metadata: Metadata = { title: "Connect idea · Book Tracker" };

export default async function ConnectIdeaPage({
  params,
  searchParams,
}: PageProps<"/ideas/[id]/connect">) {
  const { id } = await params;
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const userId = await getCurrentUserId();

  const [idea, ideas] = await Promise.all([
    getIdea(userId, id),
    listIdeas(userId, { q: query }),
  ]);
  if (!idea) notFound();

  const candidates = ideas
    .filter((other) => other.id !== idea.id)
    .map((other) => ({
      id: other.id,
      title: other.title,
      sources:
        other.sources.map(({ book }) => book.title).join(", ") || "No source books",
    }));

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Connect to another idea</h1>

      {/* A GET form: filters the list below via ?q=, like the library search. */}
      <Form action={`/ideas/${idea.id}/connect`} className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search your ideas"
            aria-label="Search your ideas"
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </Form>

      <ConnectForm
        action={connectIdeasAction.bind(null, idea.id)}
        ideaTitle={idea.title}
        candidates={candidates}
        cancelHref={`/ideas/${idea.id}`}
      />
    </div>
  );
}
