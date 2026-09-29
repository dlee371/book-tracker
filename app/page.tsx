import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/current-user";

// Landing page. Replaced by the reading dashboard in a later milestone.
export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col gap-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Book Tracker</h1>
      <p className="text-muted-foreground">
        Track what you read. Capture what you learn. Connect what you learn.
      </p>
      <div className="flex gap-2">
        {user ? (
          <Link href="/books" className={buttonVariants()}>
            Go to your library
          </Link>
        ) : (
          <>
            <Link href="/signup" className={buttonVariants()}>
              Create an account
            </Link>
            <Link href="/login" className={buttonVariants({ variant: "outline" })}>
              Sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
