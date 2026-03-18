-- CreateTable
CREATE TABLE "ChecklistCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChecklistCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChecklistItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "categoryId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChecklistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChecklistItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ChecklistCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ChecklistItem" ("checked", "createdAt", "id", "text", "type", "userId") SELECT "checked", "createdAt", "id", "text", "type", "userId" FROM "ChecklistItem";
DROP TABLE "ChecklistItem";
ALTER TABLE "new_ChecklistItem" RENAME TO "ChecklistItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
