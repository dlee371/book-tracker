import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import { db } from "@/lib/db";
import { DEV_USER_EMAIL } from "@/lib/dev-user";

// TEMPORARY (Milestone 1): always returns the seeded dev user.
// Milestone 2 replaces the body with a real session lookup; callers won't
// need to change.
//
// cache() dedupes calls within a single request, so several components can
// ask for the user without repeating the query.
export const getCurrentUserId = cache(async (): Promise<string> => {
  // The current user is a per-request question. connection() tells Next.js
  // not to prerender pages that call this at build time. (Reading the session
  // cookie in Milestone 2 has the same effect.)
  await connection();

  const user = await db.user.findUnique({
    where: { email: DEV_USER_EMAIL },
    select: { id: true },
  });
  if (!user) {
    throw new Error("Dev user not found. Run `npm run db:seed` first.");
  }
  return user.id;
});
