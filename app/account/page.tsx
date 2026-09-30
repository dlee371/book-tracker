import type { Metadata } from "next";
import { DownloadIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { getCurrentUserId, getSession } from "@/lib/current-user";

export const metadata: Metadata = { title: "Account · Book Tracker" };

export default async function AccountPage() {
  await getCurrentUserId(); // redirects to /login when signed out
  const session = await getSession();
  const user = session!.user;

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground">
          {user.name} · {user.email}
        </p>
      </div>

      <section className="grid gap-3">
        <h2 className="font-semibold">Export your data</h2>
        <p className="text-sm text-muted-foreground">
          Download everything: books, notes, ideas, tags and connections. JSON is
          complete and machine-readable; Markdown is for reading or importing
          into other note apps.
        </p>
        <div className="flex flex-wrap gap-2">
          {/* Plain <a> (not next/link): these are file downloads, not pages. */}
          <a href="/api/export?format=json" className={buttonVariants({ variant: "outline" })}>
            <DownloadIcon /> JSON
          </a>
          <a href="/api/export?format=markdown" className={buttonVariants({ variant: "outline" })}>
            <DownloadIcon /> Markdown
          </a>
        </div>
      </section>
    </div>
  );
}
