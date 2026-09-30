"use client";

// A moment in time (e.g. when a note was written), shown as a date in the
// reader's own time zone. The server renders it in its time zone first; the
// browser then re-renders with the reader's. suppressHydrationWarning tells
// React that difference is expected (its documented approach for timestamps).
//
// Not for calendar dates like "finished on" (see lib/dates.ts).
export function LocalDate({ date }: { date: Date }) {
  return (
    <time dateTime={date.toISOString()} suppressHydrationWarning>
      {date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })}
    </time>
  );
}
