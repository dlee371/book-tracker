import Link from "next/link";
import { LightbulbIcon, PlusIcon } from "lucide-react";

import { BookMiniList } from "@/components/dashboard/book-mini-list";
import { BooksFinishedChart } from "@/components/dashboard/books-finished-chart";
import { StatTile } from "@/components/dashboard/stat-tile";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/current-user";
import { getDashboard, type Dashboard } from "@/lib/services/dashboard";

// Signed out: a short landing page. Signed in: the reading dashboard.
export default async function Home() {
  const user = await getCurrentUser();
  if (!user) return <Landing />;

  const dashboard = await getDashboard(user.id);
  const firstName = user.name.split(" ")[0];

  return (
    <div className="grid gap-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome back, {firstName}
      </h1>
      {dashboard.bookCount === 0 ? <GettingStarted /> : <DashboardView d={dashboard} />}
    </div>
  );
}

function DashboardView({ d }: { d: Dashboard }) {
  const year = new Date().getUTCFullYear();
  const { stats, knowledge } = d;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={`Read in ${year}`} value={stats.completedThisYear} />
        <StatTile label="Read all time" value={stats.completedCount} />
        <StatTile
          label="Pages read"
          value={stats.pagesRead}
          detail={
            stats.finishedWithoutPageCount > 0
              ? `${stats.finishedWithoutPageCount} ${stats.finishedWithoutPageCount === 1 ? "book has" : "books have"} no page count`
              : undefined
          }
        />
        <StatTile
          label="Ideas captured"
          value={knowledge.ideaCount}
          detail={`${knowledge.noteCount} notes · ${knowledge.connectionCount} connections`}
        />
      </div>

      <Section title="Currently reading">
        <BookMiniList
          books={d.reading}
          show="started"
          empty="Nothing in progress. Pick something from your want-to-read list."
        />
      </Section>

      <Section
        title="Recent ideas"
        action={
          <Link href="/ideas" className="text-sm text-muted-foreground hover:text-foreground">
            All ideas
          </Link>
        }
      >
        {knowledge.recentIdeas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No ideas yet. Open a book and turn a note into an idea.
          </p>
        ) : (
          <ul className="grid gap-2">
            {knowledge.recentIdeas.map((idea) => (
              <li key={idea.id}>
                <Link
                  href={`/ideas/${idea.id}`}
                  className="flex items-start gap-2 rounded-lg p-1.5 text-sm hover:bg-muted/60"
                >
                  <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  <span className="grid">
                    <span className="font-medium">{idea.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {idea.sources.map(({ book }) => book.title).join(", ") || "No source books"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Books finished, last 12 months">
        <BooksFinishedChart months={d.months} />
      </Section>

      <div className="grid gap-10 sm:grid-cols-2">
        <Section title="Recently finished">
          <BookMiniList books={d.recentlyFinished} show="finished" empty="No finished books yet." />
        </Section>
        <Section
          title={`Want to read · ${d.wantToReadCount}`}
          action={
            d.wantToReadCount > d.wantToRead.length ? (
              <Link
                href="/books?status=WANT_TO_READ"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                See all
              </Link>
            ) : undefined
          }
        >
          <BookMiniList books={d.wantToRead} show="none" empty="Your want-to-read list is empty." />
        </Section>
      </div>

      {(d.topGenres.length > 0 || d.topAuthors.length > 0) && (
        <div className="grid gap-10 sm:grid-cols-2">
          <Section title="Most-read genres">
            <RankedList
              items={d.topGenres.map((g) => ({ label: g.genre, value: g.count }))}
            />
          </Section>
          <Section title="Most-read authors">
            <RankedList
              items={d.topAuthors.map((a) => ({
                label: a.author,
                value: a.count,
                extra: a.averageRating ? `avg ${a.averageRating.toFixed(1)}★` : undefined,
              }))}
            />
          </Section>
        </div>
      )}
    </>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="grid content-start gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function RankedList({
  items,
}: {
  items: { label: string; value: number; extra?: string }[];
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Finish a few books to see this.</p>;
  }
  return (
    <ol className="grid gap-1.5 text-sm">
      {items.map((item) => (
        <li key={item.label} className="flex items-baseline justify-between gap-4">
          <span className="truncate">{item.label}</span>
          <span className="shrink-0 text-muted-foreground tabular-nums">
            {item.value} {item.value === 1 ? "book" : "books"}
            {item.extra && ` · ${item.extra}`}
          </span>
        </li>
      ))}
    </ol>
  );
}

function GettingStarted() {
  return (
    <div className="grid justify-items-start gap-3 rounded-xl border border-dashed p-8">
      <p className="font-medium">Your library is empty</p>
      <p className="text-sm text-muted-foreground">
        Add the book you&apos;re reading now. Then write notes as you go, and turn
        the best ones into ideas.
      </p>
      <Link href="/books/new" className={buttonVariants()}>
        <PlusIcon /> Add your first book
      </Link>
    </div>
  );
}

function Landing() {
  return (
    <div className="flex flex-col gap-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Book Tracker</h1>
      <p className="text-muted-foreground">
        Track what you read. Capture what you learn. Connect what you learn.
      </p>
      <div className="flex gap-2">
        <Link href="/signup" className={buttonVariants()}>
          Create an account
        </Link>
        <Link href="/login" className={buttonVariants({ variant: "outline" })}>
          Sign in
        </Link>
      </div>
    </div>
  );
}
