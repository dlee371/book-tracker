import path from "node:path";

import { defineConfig } from "vitest/config";

import { TEST_DATABASE_URL } from "./tests/support/test-db";

export default defineConfig({
  resolve: {
    alias: {
      "@": import.meta.dirname,
      // Tests are server code, so the server-only guard doesn't apply.
      "server-only": path.join(import.meta.dirname, "tests/support/empty.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/support/global-setup.ts"],
    env: { DATABASE_URL: TEST_DATABASE_URL },
  },
});
