import type { Metadata } from "next";
import Link from "next/link";

import { SignInForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Sign in · Book Tracker" };

export default function LoginPage() {
  return (
    <>
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back to your library.
        </p>
      </div>
      <SignInForm />
      <p className="text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="text-foreground underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </>
  );
}
