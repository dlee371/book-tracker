import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { IdeaCard } from "@/components/ideas/idea-card";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/current-user";
import { listIdeas } from "@/lib/services/ideas";

export const metadata: Metadata = { title: "Ideas · Book Tracker" };

export default async function IdeasPage() {
  const userId = await getCurrentUserId();
  const ideas = await listIdeas(userId);

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ideas</h1>
          <p className="text-sm text-muted-foreground">
            What you&apos;ve learned, in your own words.
          </p>
        </div>
        <Link href="/ideas/new" className={buttonVariants()}>
          <PlusIcon /> New idea
        </Link>
      </div>

      {ideas.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="font-medium">No ideas yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a book, find a note worth keeping, and choose “Turn into idea”.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  );
}
