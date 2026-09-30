import "server-only";

// The visitor's IP address, for rate limiting. Behind Vercel (and most
// hosts), the platform sets x-forwarded-for; the first entry is the client.
// Locally there's no proxy, so everyone is "unknown", which is fine for
// development.
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}
