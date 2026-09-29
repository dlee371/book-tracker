import Form from "next/form";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { signOutAction } from "@/app/(auth)/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/current-user";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b">
      <nav className="mx-auto flex h-14 w-full max-w-3xl items-center gap-4 px-4 sm:gap-6">
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
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Phones: a search icon (the /search page has a full-width box).
                  Wider screens: an inline search box. */}
              <Link
                href="/search"
                aria-label="Search"
                className={buttonVariants({
                  variant: "ghost",
                  size: "icon-sm",
                  className: "sm:hidden",
                })}
              >
                <SearchIcon />
              </Link>
              <Form action="/search" role="search" className="hidden sm:block">
                <Input
                  type="search"
                  name="q"
                  placeholder="Search…"
                  aria-label="Search everything"
                  className="h-8 w-44"
                />
              </Form>
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
