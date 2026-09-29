import type { Metadata } from "next";
import Link from "next/link";

import { getCurrentUserId } from "@/lib/current-user";
import { listTagsWithCounts } from "@/lib/services/tags";
import { tagHref } from "@/lib/tags";

export const metadata: Metadata = { title: "Tags · Book Tracker" };

export default async function TagsPage() {
  const userId = await getCurrentUserId();
  const tags = await listTagsWithCounts(userId);

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Tags</h1>
      {tags.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="font-medium">No tags yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add tags to your notes to group ideas across books.
          </p>
        </div>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag.name}>
              <Link
                href={tagHref(tag.name)}
                className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted"
              >
                #{tag.name}
                <span className="text-xs tabular-nums text-muted-foreground">
                  {tag.noteCount}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
