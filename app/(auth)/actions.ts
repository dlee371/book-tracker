"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { clientIp } from "@/lib/client-ip";
import { consumeRateLimit } from "@/lib/services/rate-limit";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";

export type AuthFormState = {
  fieldErrors?: Partial<Record<string, string[]>>;
  message?: string;
  // Re-fill name and email after an error. The password is never sent back.
  values?: { name?: string; email?: string };
};

// Limits on attempts, enforced before calling Better Auth. Our actions call
// auth.api directly, which bypasses Better Auth's own HTTP rate limiter.
const FIFTEEN_MINUTES = 15 * 60;
const TOO_MANY = (seconds: number) =>
  `Too many attempts. Try again in ${Math.ceil(seconds / 60)} minute${seconds > 60 ? "s" : ""}.`;

export async function signUpAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const input = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const values = { name: input.name, email: input.email };

  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const requestHeaders = await headers();
  const limit = await consumeRateLimit(`sign-up:ip:${clientIp(requestHeaders)}`, {
    max: 5,
    windowSeconds: 60 * 60,
  });
  if (!limit.allowed) return { message: TOO_MANY(limit.retryAfterSeconds), values };

  try {
    // Creates the user, hashes the password, and (via the nextCookies
    // plugin) signs them in by setting the session cookie.
    await auth.api.signUpEmail({ body: parsed.data, headers: requestHeaders });
  } catch (error) {
    if (error instanceof APIError) {
      return { message: error.message, values };
    }
    throw error;
  }

  // redirect() works by throwing, so it must stay outside the try/catch.
  redirect("/books");
}

export async function signInAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const input = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const values = { email: input.email };

  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  // Per email (slows guessing one account's password) and per IP (slows one
  // attacker trying many accounts). Every attempt counts, not only failures.
  const requestHeaders = await headers();
  for (const [key, max] of [
    [`sign-in:email:${parsed.data.email}`, 10],
    [`sign-in:ip:${clientIp(requestHeaders)}`, 20],
  ] as const) {
    const limit = await consumeRateLimit(key, { max, windowSeconds: FIFTEEN_MINUTES });
    if (!limit.allowed) return { message: TOO_MANY(limit.retryAfterSeconds), values };
  }

  try {
    await auth.api.signInEmail({ body: parsed.data, headers: requestHeaders });
  } catch (error) {
    if (error instanceof APIError) {
      // Same message whether the email or the password is wrong, so the form
      // doesn't reveal which emails have accounts.
      return { message: "Invalid email or password", values };
    }
    throw error;
  }

  redirect("/books");
}

export async function signOutAction(): Promise<void> {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
