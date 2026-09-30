import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { consumeRateLimit } from "@/lib/services/rate-limit";

const key = () => `test:${randomUUID()}`;
const createdEmails: string[] = [];

afterAll(async () => {
  await db.user.deleteMany({ where: { email: { in: createdEmails } } });
});

describe("consumeRateLimit", () => {
  it("allows `max` attempts per window, then blocks", async () => {
    const k = key();
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await consumeRateLimit(k, { max: 3, windowSeconds: 60 }));
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results[3].retryAfterSeconds).toBeGreaterThan(0);
    expect(results[3].retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("starts a fresh window once the old one has expired", async () => {
    const k = key();
    await consumeRateLimit(k, { max: 1, windowSeconds: 60 });
    expect((await consumeRateLimit(k, { max: 1, windowSeconds: 60 })).allowed).toBe(false);
    // Pretend the window started two minutes ago.
    await db.rateLimit.update({
      where: { key: k },
      data: { windowStart: new Date(Date.now() - 120_000) },
    });
    expect((await consumeRateLimit(k, { max: 1, windowSeconds: 60 })).allowed).toBe(true);
  });

  it("can't be beaten by simultaneous requests", async () => {
    const k = key();
    const results = await Promise.all(
      Array.from({ length: 20 }, () => consumeRateLimit(k, { max: 5, windowSeconds: 60 })),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(5);
  });

  afterAll(async () => {
    await db.rateLimit.deleteMany({ where: { key: { startsWith: "test:" } } });
  });
});

describe("Better Auth HTTP endpoints", () => {
  it("rejects sign-in and sign-up over HTTP (only our rate-limited actions may)", async () => {
    for (const path of ["sign-in/email", "sign-up/email"]) {
      const response = await auth.handler(
        new Request(`http://localhost:3000/api/auth/${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
          body: JSON.stringify({ email: "x@example.test", password: "whatever-123", name: "X" }),
        }),
      );
      expect(response.status).toBe(404);
    }
  });

  it("still allows the direct calls our server actions make", async () => {
    const email = `${randomUUID()}@example.test`;
    createdEmails.push(email);
    const { user } = await auth.api.signUpEmail({
      body: { name: "Direct", email, password: "a-long-password" },
    });
    expect(user.email).toBe(email);
    const session = await auth.api.signInEmail({ body: { email, password: "a-long-password" } });
    expect(session.token).toBeTruthy();
  });
});
