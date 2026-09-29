"use client";

import { Button } from "@/components/ui/button";

export function DeleteBookButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm("Delete this book? This can't be undone.")) {
          event.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="destructive">
        Delete book
      </Button>
    </form>
  );
}
