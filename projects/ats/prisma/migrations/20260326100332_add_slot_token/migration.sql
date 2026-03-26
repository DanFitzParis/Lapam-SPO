-- AlterTable
ALTER TABLE "InterviewSlot" ADD COLUMN "slotToken" TEXT NOT NULL DEFAULT gen_random_uuid();

-- CreateIndex
CREATE UNIQUE INDEX "InterviewSlot_slotToken_key" ON "InterviewSlot"("slotToken");
