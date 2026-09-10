-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "passage_group" TEXT,
ADD COLUMN     "passage_order" INTEGER;

-- CreateIndex
CREATE INDEX "questions_passage_group_idx" ON "questions"("passage_group");

-- CreateIndex
CREATE INDEX "questions_is_published_part_idx" ON "questions"("is_published", "part");
