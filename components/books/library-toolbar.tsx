import Form from "next/form";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { SortSelect } from "@/components/books/sort-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STATUS_LABELS, STATUS_OPTIONS } from "@/lib/books";
import type { ReadingStatus } from "@/lib/generated/prisma/enums";
import { libraryHref, type LibraryQuery } from "@/lib/library-query";
import { cn } from "@/lib/utils";

// Search box + sort menu. Submitting navigates to /books?q=…&sort=…
// (a GET request), and the page re-renders on the server with the new query.
export function LibrarySearch({ query }: { query: LibraryQuery }) {
  return (
    // Inputs keep their defaultValue after the first render. Keying the form
    // on the current URL resets it when the query changes some other way,
    // e.g. clicking "Clear filters".
    <Form key={libraryHref(query)} action="/books" className="flex gap-2">
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          name="q"
          defaultValue={query.q}
          placeholder="Search title, author or genre"
          aria-label="Search title, author or genre"
          className="pl-8"
        />
      </div>
      {/* Keep the selected status tab when searching or sorting. */}
      {query.status && <input type="hidden" name="status" value={query.status} />}
      <SortSelect defaultValue={query.sort} />
      <Button type="submit" variant="outline">
        Search
      </Button>
    </Form>
  );
}

export function StatusTabs({
  query,
  counts,
}: {
  query: LibraryQuery;
  counts: Record<ReadingStatus, number>;
}) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const tabs = [
    { status: null, label: "All", count: total },
    ...STATUS_OPTIONS.map((status) => ({
      status,
      label: STATUS_LABELS[status],
      count: counts[status],
    })),
  ];

  return (
    <nav aria-label="Filter by status" className="flex flex-wrap gap-1">
      {tabs.map((tab) => {
        const active = tab.status === query.status;
        return (
          <Link
            key={tab.label}
            href={libraryHref(query, { status: tab.status })}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1 text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.label}{" "}
            <span className={cn("tabular-nums", !active && "opacity-60")}>
              {tab.count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
