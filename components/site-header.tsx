import Link from "next/link";

import { signOutAction } from "@/app/(auth)/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/current-user";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b">
      <nav className="mx-auto flex h-14 w-full max-w-3xl items-center gap-6 px-4">
        <Link href="/" className="font-semibold tracking-tight">
          Book Tracker
        </Link>
        {user && (
          <>
            <Link
              href="/books"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Library
            </Link>
            <Link
              href="/ideas"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Ideas
            </Link>
            <Link
              href="/tags"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Tags
            </Link>
          </>
        )}
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.name}
              </span>
              <form action={signOutAction}>
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
