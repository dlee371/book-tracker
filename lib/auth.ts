import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/lib/db";

// Server-side authentication setup. Reads BETTER_AUTH_SECRET and
// BETTER_AUTH_URL from the environment.
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  // Our forms sign in and up through server actions (which apply our own
  // rate limits), never through these HTTP endpoints, so switch them off.
  // This only affects /api/auth/* requests; auth.api calls still work.
  disabledPaths: ["/sign-in/email", "/sign-up/email"],
  // Lets server actions set the session cookie. Must be the last plugin.
  plugins: [nextCookies()],
});
