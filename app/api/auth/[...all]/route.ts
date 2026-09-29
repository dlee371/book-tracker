import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

// Serves Better Auth's HTTP endpoints under /api/auth/*. Our own forms use
// server actions instead, but this is where browser-side auth calls and
// future sign-in providers (e.g. OAuth callbacks) arrive.
export const { GET, POST } = toNextJsHandler(auth);
