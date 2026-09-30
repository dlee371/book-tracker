import { execSync } from "node:child_process";

import pg from "pg";

import { TEST_DATABASE_URL } from "./test-db";

// Runs once before all tests: creates the test database if needed and brings
// it up to date with every migration (the same command deploys will use).
export default async function setup() {
  const url = new URL(TEST_DATABASE_URL);
  const name = url.pathname.slice(1);
  if (!name.endsWith("_test")) {
    throw new Error(`Refusing to run tests against "${name}": name must end in _test.`);
  }

  // CREATE DATABASE has to run while connected to a different database.
  const admin = new URL(url);
  admin.pathname = "/postgres";
  admin.search = "";
  const client = new pg.Client({ connectionString: admin.toString() });
  await client.connect();
  const { rowCount } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
  if (rowCount === 0) {
    // Identifiers can't be query parameters; the name was checked above.
    await client.query(`CREATE DATABASE "${name}"`);
  }
  // Sessions must run in UTC, matching production and how Prisma writes
  // timestamps (see README, "Local setup").
  await client.query(`ALTER DATABASE "${name}" SET timezone TO 'UTC'`);
  await client.end();

  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "pipe",
  });
}
