import type { MonthCount } from "@/lib/services/dashboard";

// Column chart of books finished per month, in plain HTML/CSS (no chart
// library). One series, so no legend; the section title names it.
// - Columns are at most 24px wide, with 4px rounded tops, from one baseline.
// - Only the peak month is labeled; every column has a tooltip on hover and
//   keyboard focus, and the same numbers are available as a table.
// - The color token (--reading-bar) is validated for contrast in both themes.

const monthName = (date: Date, style: "short" | "long") =>
  date.toLocaleDateString("en-US", { month: style, timeZone: "UTC" });

const books = (n: number) => `${n} ${n === 1 ? "book" : "books"}`;

export function BooksFinishedChart({ months }: { months: MonthCount[] }) {
  const max = Math.max(...months.map((m) => m.count));
  const peakIndex = max > 0 ? months.findIndex((m) => m.count === max) : -1;

  return (
    <div className="grid gap-3">
      <div className="flex h-36 items-end gap-1 border-b pt-6" role="list">
        {months.map((m, i) => {
          const label = `${monthName(m.month, "long")} ${m.month.getUTCFullYear()}`;
          return (
            <div
              key={m.month.toISOString()}
              role="listitem"
              tabIndex={0}
              aria-label={`${label}: ${books(m.count)} finished`}
              className="group relative flex h-full flex-1 items-end justify-center outline-none"
            >
              {/* Tooltip: value first, then the month. */}
              <span className="pointer-events-none absolute bottom-full z-10 mb-1 hidden rounded-md border bg-popover px-2 py-1 text-center text-xs whitespace-nowrap shadow-sm group-hover:block group-focus-visible:block">
                <span className="block font-semibold">{books(m.count)}</span>
                <span className="text-muted-foreground">{label}</span>
              </span>
              <span
                className="relative w-full max-w-6 rounded-t-[4px] bg-reading-bar transition-opacity group-hover:opacity-80 group-focus-visible:opacity-80"
                // Zero-book months get no bar at all rather than a sliver.
                style={{ height: max > 0 ? `${(m.count / max) * 100}%` : 0 }}
              >
                {/* Only the peak month is labeled, just above its bar. */}
                {i === peakIndex && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-medium tabular-nums">
                    {m.count}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 text-center text-[11px] text-muted-foreground" aria-hidden>
        {months.map((m) => (
          <span key={m.month.toISOString()} className="flex-1">
            <span className="sm:hidden">{monthName(m.month, "short")[0]}</span>
            <span className="hidden sm:inline">{monthName(m.month, "short")}</span>
          </span>
        ))}
      </div>
      <details className="text-sm">
        <summary className="w-fit cursor-pointer text-xs text-muted-foreground">
          Show as table
        </summary>
        <table className="mt-2 w-full max-w-xs text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="font-normal">Month</th>
              <th className="text-right font-normal">Books finished</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.month.toISOString()}>
                <td>
                  {monthName(m.month, "short")} {m.month.getUTCFullYear()}
                </td>
                <td className="text-right tabular-nums">{m.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
