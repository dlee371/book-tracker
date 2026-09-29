# Book Tracker

Track what you read. Capture what you learn. Connect what you learn.

A personal book tracker combined with a knowledge base of notes and ideas.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **PostgreSQL 18** via **Prisma 7**
- **Tailwind CSS 4** + **shadcn/ui**

## Local setup

Prerequisites: Node.js 24 (see `.node-version`) and PostgreSQL 18.

```bash
# 1. Start Postgres and create the database (Homebrew on macOS)
brew services start postgresql@18
createdb book_tracker

# 2. Configure environment variables
cp .env.example .env   # then edit DATABASE_URL

# 3. Install dependencies (also generates the Prisma Client)
npm install

# 4. Apply database migrations
npm run db:migrate

# 5. Start the dev server at http://localhost:3000
npm run dev
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |
| `npm run db:migrate` | Create/apply migrations after editing `prisma/schema.prisma` |
| `npm run db:generate` | Regenerate the Prisma Client |
| `npm run db:studio` | Browse the database in a web UI |

## Project structure

```
app/                  Pages and layouts (Next.js App Router)
components/ui/        shadcn/ui components
lib/db.ts             Shared Prisma Client (server-only)
lib/generated/        Generated Prisma Client (not committed)
prisma/schema.prisma  Database schema
prisma.config.ts      Prisma CLI configuration
```
