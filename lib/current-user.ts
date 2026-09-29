import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";

// Reads the session cookie from the incoming request and looks it up.
// cache() means this runs at most once per request, however many components
// ask. Reading headers() also tells Next.js the page is per-request.
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

// For pages that work with or without a signed-in user (header, home page).
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

// For everything that requires a signed-in user: pages, server actions and
// anything that touches user data. Sends signed-out visitors to /login.
export async function getCurrentUserId(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.user.id;
}
