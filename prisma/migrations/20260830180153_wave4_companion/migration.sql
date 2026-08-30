-- AlterTable
ALTER TABLE "User" ADD COLUMN     "careStars" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Companion" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullness" INTEGER NOT NULL DEFAULT 80,
    "mood" INTEGER NOT NULL DEFAULT 80,
    "energy" INTEGER NOT NULL DEFAULT 80,
    "lastTickAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Companion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomPlacement" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Companion_childId_key" ON "Companion"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomPlacement_childId_slot_key" ON "RoomPlacement"("childId", "slot");

-- AddForeignKey
ALTER TABLE "Companion" ADD CONSTRAINT "Companion_childId_fkey" FOREIGN KEY ("childId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomPlacement" ADD CONSTRAINT "RoomPlacement_childId_fkey" FOREIGN KEY ("childId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
