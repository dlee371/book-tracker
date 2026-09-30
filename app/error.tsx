"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

// Shown when a page throws. In production, Next.js replaces server error
// messages with a generic one plus a `digest` id, so nothing sensitive
// reaches the browser; the digest matches the server log entry.
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid justify-items-start gap-3 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="text-muted-foreground">
        This page couldn&apos;t be loaded. Your data is safe; try again in a moment.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground">Reference: {error.digest}</p>
      )}
      <Button onClick={() => retry()}>Try again</Button>
    </div>
  );
}
