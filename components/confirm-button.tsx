"use client";

import { Button } from "@/components/ui/button";

// A destructive button that asks for confirmation before submitting its
// server action.
export function ConfirmButton({
  action,
  message,
  children,
  size,
}: {
  action: () => Promise<void>;
  message: string;
  children: React.ReactNode;
  size?: "default" | "sm" | "xs";
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm(message)) event.preventDefault();
      }}
    >
      <Button type="submit" variant="destructive" size={size}>
        {children}
      </Button>
    </form>
  );
}
