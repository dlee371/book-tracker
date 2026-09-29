"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";

export type AuthFormState = {
  fieldErrors?: Partial<Record<string, string[]>>;
  message?: string;
  // Re-fill name and email after an error. The password is never sent back.
  values?: { name?: string; email?: string };
};

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

  try {
    // Creates the user, hashes the password, and (via the nextCookies
    // plugin) signs them in by setting the session cookie.
    await auth.api.signUpEmail({ body: parsed.data, headers: await headers() });
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

  try {
    await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
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
