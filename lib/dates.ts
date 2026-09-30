// Helpers for date-only values (DB columns declared with @db.Date).
// Prisma returns them as a Date at midnight UTC, so they must be formatted in
// UTC. Formatting in local time would show the previous day for anyone west
// of Greenwich.

export function formatCalendarDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Value for <input type="date">, which expects "YYYY-MM-DD".
export function toDateInputValue(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}
