import { userInfo } from "node:os";

// The database the tests use. Never the development database: the setup
// refuses to run unless the database name ends in "_test".
// Defaults to local Postgres as the current OS user (Homebrew's default);
// the username must be explicit because Prisma's migration engine, unlike
// the pg driver, doesn't fall back to it.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  `postgresql://${userInfo().username}@localhost:5432/book_tracker_test?schema=public`;
