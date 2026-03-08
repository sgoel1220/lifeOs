-- CreateTable
CREATE TABLE "BrainDump" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "location" TEXT NOT NULL DEFAULT 'Pune',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrainDump_pkey" PRIMARY KEY ("id")
);
