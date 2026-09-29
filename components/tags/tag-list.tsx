import Link from "next/link";

import { tagHref } from "@/lib/tags";

export function TagList({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {names.map((name) => (
        <li key={name}>
          <Link
            href={tagHref(name)}
            className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            #{name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
