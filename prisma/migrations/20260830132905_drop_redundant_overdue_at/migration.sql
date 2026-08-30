/*
  Warnings:

  - You are about to drop the column `overdueAt` on the `Task` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" DATETIME NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "coinReward" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "childComment" TEXT,
    "parentComment" TEXT,
    "submittedAt" DATETIME,
    "reviewedAt" DATETIME,
    "templateId" TEXT,
    "occurrenceDate" TEXT,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_childId_fkey" FOREIGN KEY ("childId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TaskTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("autoApprove", "childComment", "childId", "coinReward", "createdAt", "description", "dueAt", "familyId", "id", "occurrenceDate", "parentComment", "reviewedAt", "status", "submittedAt", "templateId", "title", "updatedAt", "xpReward") SELECT "autoApprove", "childComment", "childId", "coinReward", "createdAt", "description", "dueAt", "familyId", "id", "occurrenceDate", "parentComment", "reviewedAt", "status", "submittedAt", "templateId", "title", "updatedAt", "xpReward" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_familyId_idx" ON "Task"("familyId");
CREATE INDEX "Task_childId_status_idx" ON "Task"("childId", "status");
CREATE UNIQUE INDEX "Task_templateId_occurrenceDate_key" ON "Task"("templateId", "occurrenceDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
