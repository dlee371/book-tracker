// Tag helpers, safe to use on both server and client.

export const MAX_TAG_LENGTH = 50;
export const MAX_TAGS_PER_ITEM = 20;

// "  #Decision   Making " -> "decision making"
export function normalizeTagName(raw: string): string {
  return raw.trim().replace(/^#+/, "").replace(/\s+/g, " ").trim().toLowerCase();
}

// "Habits, #environment,, habits" -> ["habits", "environment"]
// Splits on commas, normalizes, drops empties and duplicates (keeps order).
export function parseTagList(raw: string): string[] {
  const names = raw.split(",").map(normalizeTagName).filter(Boolean);
  return [...new Set(names)];
}

export function tagHref(name: string): string {
  return `/tags/${encodeURIComponent(name)}`;
}

// The reverse of tagHref, for the [name] route param. Next.js passes route
// params still URL-encoded ("decision%20making"), so decode once. Returns
// null for malformed input like "%E0", which decodeURIComponent rejects.
export function tagNameFromParam(param: string): string | null {
  try {
    return normalizeTagName(decodeURIComponent(param));
  } catch {
    return null;
  }
}
