import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/current-user";

// Shared by /login and /signup. The "(auth)" folder groups these routes
// without adding "/auth" to the URL.
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Already signed in? Nothing to do here.
  if (await getCurrentUser()) redirect("/books");

  return (
    <div className="mx-auto grid w-full max-w-sm gap-6 py-12">{children}</div>
  );
}
