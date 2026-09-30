// Configuration for the Prisma CLI (migrate, generate, studio).
// The app itself connects through lib/db.ts, not this file.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx --conditions=react-server prisma/seed.ts",
  },
  datasource: {
    // Hosted Postgres (Neon) offers a pooled URL for the app and a direct one
    // for migrations, which need a dedicated connection. Prefer the direct
    // one when it's set; env() throws a clear error if neither exists.
    url: process.env.DATABASE_URL_UNPOOLED ?? env("DATABASE_URL"),
  },
});
