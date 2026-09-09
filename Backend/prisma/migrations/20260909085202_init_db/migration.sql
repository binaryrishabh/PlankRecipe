/*
  Warnings:

  - Added the required column `diff` to the `Tweak` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modified` to the `Tweak` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sortOrder` to the `Tweak` table without a default value. This is not possible if the table is not empty.
  - Added the required column `text` to the `Tweak` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tweak" ADD COLUMN     "author" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date" TEXT,
ADD COLUMN     "diff" JSONB NOT NULL,
ADD COLUMN     "modified" JSONB NOT NULL,
ADD COLUMN     "sortOrder" INTEGER NOT NULL,
ADD COLUMN     "text" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Tweak_recipeId_sortOrder_idx" ON "Tweak"("recipeId", "sortOrder");
