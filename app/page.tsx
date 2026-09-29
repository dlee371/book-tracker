import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";

// Temporary home page for Milestone 0: proves the chain
// Next.js -> Prisma -> Postgres works. Replaced by the dashboard later.
export default function Home() {
  return (
    <div className="flex flex-col gap-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Book Tracker</h1>
      <p className="text-muted-foreground">
        Track what you read. Capture what you learn. Connect what you learn.
      </p>
      <Link href="/books" className={buttonVariants({ className: "w-fit" })}>
        Go to your library
      </Link>
      <Suspense fallback={<p className="text-sm">Checking database…</p>}>
        <DatabaseStatus />
      </Suspense>
    </div>
  );
}

async function DatabaseStatus() {
  // Run this on every request rather than once at build time.
  await connection();

  const version = await getDatabaseVersion();

  if (!version) {
    return (
      <p className="text-sm text-red-700 dark:text-red-400">
        Database not reachable. Is Postgres running? Check DATABASE_URL in .env.
      </p>
    );
  }

  return (
    <p className="text-sm text-green-700 dark:text-green-400">
      Database connected: {version}
    </p>
  );
}

// Only the database call goes inside try/catch; JSX is built afterwards.
async function getDatabaseVersion(): Promise<string | null> {
  try {
    const [row] = await db.$queryRaw<{ version: string }[]>`SELECT version()`;
    return row.version.split(" on ")[0];
  } catch (error) {
    console.error("Database check failed:", error);
    return null;
  }
}
