import Form from "next/form";
import Link from "next/link";
import { SearchIcon, UserIcon } from "lucide-react";

import { signOutAction } from "@/app/(auth)/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/current-user";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b">
      {/* Phones: logo and account actions on the first row, section links on a
          second row. Wider screens: everything on one row. */}
      <nav className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 sm:h-14 sm:flex-nowrap sm:gap-6 sm:py-0">
        <Link href="/" className="font-semibold tracking-tight">
          Book Tracker
        </Link>
        {user && (
          <div className="order-last flex w-full gap-5 sm:order-none sm:w-auto sm:gap-6">
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
            <Link
              href="/graph"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Graph
            </Link>
          </div>
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
              <Link
                href="/account"
                aria-label="Account"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                <UserIcon className="size-4 sm:hidden" />
                <span className="hidden sm:inline">{user.name}</span>
              </Link>
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
