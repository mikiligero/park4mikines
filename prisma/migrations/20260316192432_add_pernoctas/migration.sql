-- CreateTable
CREATE TABLE "Pernocta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "notes" TEXT,
    "weather" TEXT,
    "cost" REAL DEFAULT 0,
    "spotId" INTEGER,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pernocta_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Pernocta_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
