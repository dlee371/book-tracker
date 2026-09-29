import type { Metadata } from "next";
import Link from "next/link";

import { SignUpForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Create account · Book Tracker" };

export default function SignUpPage() {
  return (
    <>
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Track what you read. Capture what you learn.
        </p>
      </div>
      <SignUpForm />
      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </>
  );
}
