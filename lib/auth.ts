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
  // Lets server actions set the session cookie. Must be the last plugin.
  plugins: [nextCookies()],
});
