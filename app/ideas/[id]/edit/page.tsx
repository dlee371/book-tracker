import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { updateIdeaAction } from "@/app/ideas/actions";
import { IdeaForm } from "@/components/ideas/idea-form";
import { getCurrentUserId } from "@/lib/current-user";
import { listBookOptions } from "@/lib/services/books";
import { getIdea } from "@/lib/services/ideas";

export const metadata: Metadata = { title: "Edit idea · Book Tracker" };

export default async function EditIdeaPage({
  params,
}: PageProps<"/ideas/[id]/edit">) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const [idea, books] = await Promise.all([
    getIdea(userId, id),
    listBookOptions(userId),
  ]);
  if (!idea) notFound();

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit idea</h1>
      <IdeaForm
        action={updateIdeaAction.bind(null, idea.id)}
        initialValues={{
          title: idea.title,
          explanation: idea.explanation ?? "",
          tags: idea.tags.map(({ tag }) => tag.name).join(", "),
          bookIds: idea.sources.map((source) => source.bookId).join(","),
        }}
        books={books}
        lockedBookIds={[...new Set(idea.notes.map(({ note }) => note.bookId))]}
        submitLabel="Save changes"
        cancelHref={`/ideas/${idea.id}`}
      />
    </div>
  );
}
