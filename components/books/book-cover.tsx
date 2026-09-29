import { BookIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-16 w-11",
  lg: "h-48 w-32",
};

export function BookCover({
  url,
  title,
  size = "sm",
}: {
  url: string | null;
  title: string;
  size?: keyof typeof SIZES;
}) {
  if (!url) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded bg-muted text-muted-foreground",
          SIZES[size],
        )}
      >
        <BookIcon className={size === "lg" ? "size-8" : "size-4"} />
      </div>
    );
  }
  // A plain <img> on purpose: next/image only allows hosts listed in advance,
  // and cover URLs can point anywhere.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`Cover of ${title}`}
      className={cn("shrink-0 rounded object-cover", SIZES[size])}
    />
  );
}
