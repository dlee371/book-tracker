import { MATCH_END, MATCH_START } from "@/lib/search-markers";

// Renders search snippets, turning the markers from Postgres's ts_headline
// into <mark>. Everything is rendered as text, never parsed as HTML, so user
// content can't inject markup.
export function Highlight({ text }: { text: string }) {
  const parts = text.split(new RegExp(`(${MATCH_START}[^${MATCH_END}]*${MATCH_END})`));
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith(MATCH_START) ? (
          <mark
            key={i}
            className="rounded-sm bg-amber-200/70 px-0.5 text-inherit dark:bg-amber-500/30"
          >
            {part.slice(1, -1)}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
