# Book Tracker

Track what you read. Capture what you learn. Connect what you learn.

A personal book tracker combined with a knowledge base of notes and ideas.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **PostgreSQL 18** via **Prisma 7**
- **Better Auth** (email + password, database sessions)
- **Tailwind CSS 4** + **shadcn/ui**

## Local setup

Prerequisites: Node.js 24 (see `.node-version`) and PostgreSQL 18.

```bash
# 1. Start Postgres and create the database (Homebrew on macOS)
brew services start postgresql@18
createdb book_tracker

# 2. Configure environment variables
cp .env.example .env   # then set DATABASE_URL and BETTER_AUTH_SECRET
openssl rand -base64 32   # a good value for BETTER_AUTH_SECRET

# 3. Install dependencies (also generates the Prisma Client)
npm install

# 4. Apply database migrations and load sample data
npm run db:migrate
npm run db:seed

# 5. Start the dev server at http://localhost:3000
npm run dev
```

The seed creates a development account; its sign-in details are at the top
of `prisma/seed.ts`. You can also create your own account at `/signup`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |
| `npm run db:migrate` | Create/apply migrations after editing `prisma/schema.prisma` |
| `npm run db:seed` | Recreate the dev account and its sample books |
| `npm run db:generate` | Regenerate the Prisma Client |
| `npm run db:studio` | Browse the database in a web UI |

## Project structure

```
app/                  Pages and layouts (Next.js App Router)
app/(auth)/           Login and sign-up pages and actions
app/api/auth/         Better Auth HTTP endpoints
app/books/            Library, book detail and edit pages, and server actions
app/books/[id]/notes/ Note actions and the edit-note page
app/ideas/            Idea list, detail, new/edit/connect pages and actions
app/tags/             Tag index and per-tag pages (ideas and notes)
components/auth/      Login and sign-up forms
components/books/     Book form, cover, rating stars, library toolbar
components/ideas/     Idea form and idea card
components/notes/     Note form and note card
components/tags/      Tag links
components/markdown.tsx  Safe Markdown rendering (no raw HTML)
components/ui/        shadcn/ui components
lib/services/         Data access; every function is scoped to a userId
lib/idea-links.ts     How idea connections are phrased and grouped
lib/validation/       Zod schemas for form input
lib/auth.ts           Better Auth configuration
lib/current-user.ts   Session helpers (getCurrentUserId redirects to /login)
lib/db.ts             Shared Prisma Client (server-only)
lib/generated/        Generated Prisma Client (not committed)
prisma/schema.prisma  Database schema
prisma.config.ts      Prisma CLI configuration
```
