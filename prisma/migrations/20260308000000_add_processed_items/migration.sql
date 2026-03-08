-- AlterTable
ALTER TABLE "BrainDump" ADD COLUMN "processed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ProcessedItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "dueDate" TIMESTAMP(3),
    "priority" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessedItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProcessedItem_userId_type_status_idx" ON "ProcessedItem"("userId", "type", "status");

-- CreateIndex
CREATE INDEX "ProcessedItem_userId_dueDate_idx" ON "ProcessedItem"("userId", "dueDate");

-- AddForeignKey
ALTER TABLE "ProcessedItem" ADD CONSTRAINT "ProcessedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessedItem" ADD CONSTRAINT "ProcessedItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "BrainDump"("id") ON DELETE SET NULL ON UPDATE CASCADE;
