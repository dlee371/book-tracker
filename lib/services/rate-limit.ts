import "server-only";

import { db } from "@/lib/db";

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

// Fixed-window counter: at most `max` attempts per `windowSeconds` per key.
//
// One atomic SQL statement: insert the key, or bump its count (restarting
// the window if it has expired). Because the database does the check and the
// increment together, two simultaneous requests can't both sneak under the
// limit, and every server instance shares the same counts.
export async function consumeRateLimit(
  key: string,
  { max, windowSeconds }: { max: number; windowSeconds: number },
): Promise<RateLimitResult> {
  const [row] = await db.$queryRaw<{ count: number; windowStart: Date }[]>`
    INSERT INTO rate_limits (key, count, "windowStart")
    VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limits."windowStart" < now() - make_interval(secs => ${windowSeconds}) THEN 1
        ELSE rate_limits.count + 1
      END,
      "windowStart" = CASE
        WHEN rate_limits."windowStart" < now() - make_interval(secs => ${windowSeconds}) THEN now()
        ELSE rate_limits."windowStart"
      END
    RETURNING count, "windowStart"`;

  const windowEndsMs = row.windowStart.getTime() + windowSeconds * 1000;
  return {
    allowed: row.count <= max,
    retryAfterSeconds: Math.max(1, Math.ceil((windowEndsMs - Date.now()) / 1000)),
  };
}
