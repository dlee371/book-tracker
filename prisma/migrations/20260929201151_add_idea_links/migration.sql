-- CreateEnum
CREATE TYPE "IdeaLinkType" AS ENUM ('SUPPORTS', 'EXTENDS', 'CONTRADICTS', 'RELATED');

-- CreateTable
CREATE TABLE "idea_links" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromIdeaId" TEXT NOT NULL,
    "toIdeaId" TEXT NOT NULL,
    "type" "IdeaLinkType" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idea_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idea_links_toIdeaId_idx" ON "idea_links"("toIdeaId");

-- CreateIndex
CREATE INDEX "idea_links_userId_idx" ON "idea_links"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "idea_links_fromIdeaId_toIdeaId_type_key" ON "idea_links"("fromIdeaId", "toIdeaId", "type");

-- AddForeignKey
ALTER TABLE "idea_links" ADD CONSTRAINT "idea_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_links" ADD CONSTRAINT "idea_links_fromIdeaId_fkey" FOREIGN KEY ("fromIdeaId") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_links" ADD CONSTRAINT "idea_links_toIdeaId_fkey" FOREIGN KEY ("toIdeaId") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-written: an idea can't be connected to itself. Prisma's schema
-- language can't express CHECK constraints, so it lives only here. The
-- service also checks this; the constraint guarantees it even if a bug
-- slips past the service.
ALTER TABLE "idea_links"
  ADD CONSTRAINT "idea_links_not_self" CHECK ("fromIdeaId" <> "toIdeaId");
