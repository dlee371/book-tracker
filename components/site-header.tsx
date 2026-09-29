import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b">
      <nav className="mx-auto flex h-14 w-full max-w-3xl items-center gap-6 px-4">
        <Link href="/" className="font-semibold tracking-tight">
          Book Tracker
        </Link>
        <Link
          href="/books"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Library
        </Link>
      </nav>
    </header>
  );
}
