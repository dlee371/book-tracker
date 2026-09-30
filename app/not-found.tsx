import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

// Shown for unknown URLs and whenever a page calls notFound(), e.g. a book
// that doesn't exist or belongs to someone else.
export default function NotFound() {
  return (
    <div className="grid justify-items-start gap-3 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Not found</h1>
      <p className="text-muted-foreground">
        This page doesn&apos;t exist, or it was deleted.
      </p>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        Back to your dashboard
      </Link>
    </div>
  );
}
