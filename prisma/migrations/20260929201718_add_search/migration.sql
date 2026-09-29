-- Full-text search columns. Hand-edited: Prisma declares these as plain
-- tsvector columns; here they become GENERATED columns, which Postgres
-- recomputes on every insert/update, so app code never maintains them.
--
-- Weights rank where a match was found: A (titles, authors) > B > C.
-- 'english' stems words ("habits" -> "habit") and drops stop words ("the").

ALTER TABLE "books" ADD COLUMN "search" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("author", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("genre", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("description", '')), 'C') ||
  setweight(to_tsvector('english', coalesce("review", '')), 'C')
) STORED;

ALTER TABLE "ideas" ADD COLUMN "search" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("explanation", '')), 'B')
) STORED;

ALTER TABLE "notes" ADD COLUMN "search" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("body", '')), 'B')
) STORED;

-- GIN indexes make "search @@ query" fast.
CREATE INDEX "books_search_idx" ON "books" USING GIN ("search");
CREATE INDEX "ideas_search_idx" ON "ideas" USING GIN ("search");
CREATE INDEX "notes_search_idx" ON "notes" USING GIN ("search");
