// Turns an author as typed ("James Clear") into a key for sorting by last
// name ("Clear, James").
//
// Rule: take the first author (text before "&", ",", ";" or " and "), then
// move its last word to the front. A single word is left as is ("Plato").
// It's a heuristic: multi-word surnames like "Le Guin" sort under "Guin".
//
// The migration prisma/migrations/*_add_author_sort repeats this rule in SQL
// to fill in existing books. Keep the two in sync.
export function authorSortKey(author: string): string {
  const firstAuthor = author.replace(/\s*(&|,|;|\sand\s).*$/i, "").trim();
  return firstAuthor.replace(/^(.+)\s+(\S+)$/, "$2, $1");
}
