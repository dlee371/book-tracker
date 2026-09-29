-- Adds books.authorSort, a last-name-first key used for sorting by author.
-- Hand-edited: a required column can't be added to a table that already has
-- rows, so add it as nullable, fill it in, then make it required.

-- 1. Add the column, allowing NULL for now.
ALTER TABLE "books" ADD COLUMN "authorSort" TEXT;

-- 2. Fill it in for existing books. Same rule as lib/author-sort.ts:
--    take the first author, then move the last word to the front.
UPDATE "books"
SET "authorSort" = regexp_replace(
  trim(regexp_replace("author", '\s*(&|,|;|\sand\s).*$', '', 'i')),
  '^(.+)\s+(\S+)$',
  '\2, \1'
);

-- 3. Every row has a value now, so require one from here on.
ALTER TABLE "books" ALTER COLUMN "authorSort" SET NOT NULL;
