import "server-only";

import { db } from "@/lib/db";
import { listIdeas } from "@/lib/services/ideas";

// Everything the home dashboard shows, in one call.

const bookCard = {
  id: true,
  title: true,
  author: true,
  coverUrl: true,
  startedAt: true,
  finishedAt: true,
  rating: true,
} as const;

export type MonthCount = { month: Date; count: number };

export async function getDashboard(userId: string) {
  // Finish dates are stored as UTC calendar dates, so year and month
  // boundaries are computed in UTC too.
  const now = new Date();
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const twelveMonthsAgo = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1),
  );
  const completed = { userId, status: "COMPLETED" } as const;

  // None of these depend on each other, so run them all at once.
  const [
    reading,
    recentlyFinished,
    wantToRead,
    wantToReadCount,
    bookCount,
    completedCount,
    completedThisYear,
    pages,
    genreGroups,
    authorGroups,
    finishedLastYear,
    noteCount,
    ideaCount,
    connectionCount,
    recentIdeas,
  ] = await Promise.all([
    db.book.findMany({
      where: { userId, status: "READING" },
      select: bookCard,
      orderBy: [{ startedAt: { sort: "desc", nulls: "last" } }, { title: "asc" }],
    }),
    db.book.findMany({
      where: completed,
      select: bookCard,
      orderBy: [{ finishedAt: { sort: "desc", nulls: "last" } }, { title: "asc" }],
      take: 5,
    }),
    db.book.findMany({
      where: { userId, status: "WANT_TO_READ" },
      select: bookCard,
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.book.count({ where: { userId, status: "WANT_TO_READ" } }),
    db.book.count({ where: { userId } }),
    db.book.count({ where: completed }),
    db.book.count({ where: { ...completed, finishedAt: { gte: startOfYear } } }),
    // Pages read = page counts of finished books. Books without a page count
    // can't contribute, so count them to say so honestly.
    db.book.aggregate({
      where: completed,
      _sum: { pageCount: true },
      _count: { pageCount: true }, // counts non-null values only
    }),
    db.book.groupBy({
      by: ["genre"],
      where: { ...completed, genre: { not: null } },
      _count: { _all: true },
      orderBy: [{ _count: { genre: "desc" } }, { genre: "asc" }],
      take: 3,
    }),
    db.book.groupBy({
      by: ["author"],
      where: completed,
      _count: { _all: true },
      _avg: { rating: true },
      orderBy: [
        { _count: { author: "desc" } },
        { _avg: { rating: "desc" } },
        { author: "asc" },
      ],
      take: 3,
    }),
    db.book.findMany({
      where: { ...completed, finishedAt: { gte: twelveMonthsAgo } },
      select: { finishedAt: true },
    }),
    db.note.count({ where: { userId } }),
    db.idea.count({ where: { userId } }),
    db.ideaLink.count({ where: { userId } }),
    listIdeas(userId, { take: 3 }),
  ]);

  // Bucket finish dates into the last 12 months, oldest first. Done in
  // JavaScript: at most a few hundred dates, and months with zero books
  // still need a bucket.
  const months: MonthCount[] = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + i, 1)),
    count: 0,
  }));
  for (const { finishedAt } of finishedLastYear) {
    if (!finishedAt) continue;
    const index =
      (finishedAt.getUTCFullYear() - twelveMonthsAgo.getUTCFullYear()) * 12 +
      finishedAt.getUTCMonth() -
      twelveMonthsAgo.getUTCMonth();
    if (index >= 0 && index < 12) months[index].count++;
  }

  return {
    bookCount,
    reading,
    recentlyFinished,
    wantToRead,
    wantToReadCount,
    stats: {
      completedCount,
      completedThisYear,
      pagesRead: pages._sum.pageCount ?? 0,
      finishedWithoutPageCount: completedCount - pages._count.pageCount,
    },
    topGenres: genreGroups.map((g) => ({ genre: g.genre!, count: g._count._all })),
    topAuthors: authorGroups.map((a) => ({
      author: a.author,
      count: a._count._all,
      averageRating: a._avg.rating,
    })),
    months,
    knowledge: { noteCount, ideaCount, connectionCount, recentIdeas },
  };
}

export type Dashboard = Awaited<ReturnType<typeof getDashboard>>;
