// Configuration for the Prisma CLI (migrate, generate, studio).
// The app itself connects through lib/db.ts, not this file.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // env() throws a clear error if DATABASE_URL is missing.
    url: env("DATABASE_URL"),
  },
});
