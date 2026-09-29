// Postgres's ts_headline wraps matching words in these markers (Unicode
// "private use" characters that never appear in normal text). The Highlight
// component turns them into <mark> elements, so no HTML is ever parsed from
// user content.
export const MATCH_START = "";
export const MATCH_END = "";
