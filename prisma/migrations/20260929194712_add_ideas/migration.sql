-- CreateTable
CREATE TABLE "ideas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idea_sources" (
    "ideaId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,

    CONSTRAINT "idea_sources_pkey" PRIMARY KEY ("ideaId","bookId")
);

-- CreateTable
CREATE TABLE "idea_notes" (
    "ideaId" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,

    CONSTRAINT "idea_notes_pkey" PRIMARY KEY ("ideaId","noteId")
);

-- CreateTable
CREATE TABLE "idea_tags" (
    "ideaId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "idea_tags_pkey" PRIMARY KEY ("ideaId","tagId")
);

-- CreateIndex
CREATE INDEX "ideas_userId_idx" ON "ideas"("userId");

-- CreateIndex
CREATE INDEX "idea_sources_bookId_idx" ON "idea_sources"("bookId");

-- CreateIndex
CREATE INDEX "idea_notes_noteId_idx" ON "idea_notes"("noteId");

-- CreateIndex
CREATE INDEX "idea_tags_tagId_idx" ON "idea_tags"("tagId");

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_sources" ADD CONSTRAINT "idea_sources_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_sources" ADD CONSTRAINT "idea_sources_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_notes" ADD CONSTRAINT "idea_notes_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_notes" ADD CONSTRAINT "idea_notes_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_tags" ADD CONSTRAINT "idea_tags_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_tags" ADD CONSTRAINT "idea_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
