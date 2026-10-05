CREATE TABLE "VisitType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX "VisitType_nameKey_key" ON "VisitType"("nameKey");

CREATE TABLE "VisitPlace" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "sourceUrl" TEXT,
    "locationName" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "visited" BOOLEAN NOT NULL DEFAULT false,
    "typeId" INTEGER,
    "authorId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VisitPlace_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "VisitType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "VisitPlace_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VisitPlace_coordinates_check" CHECK (
        ("latitude" IS NULL AND "longitude" IS NULL) OR
        ("latitude" IS NOT NULL AND "longitude" IS NOT NULL AND
         "latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180)
    )
);
CREATE INDEX "VisitPlace_visited_typeId_idx" ON "VisitPlace"("visited", "typeId");

INSERT INTO "VisitType" ("name", "nameKey") VALUES
('Ruta de montaña y senderismo', 'ruta de montana y senderismo'),
('Manantial y fuente', 'manantial y fuente'),
('Cascada', 'cascada'),
('Río, lago y zona de baño', 'rio, lago y zona de bano'),
('Playa y cala', 'playa y cala'),
('Pueblo y ciudad', 'pueblo y ciudad'),
('Mirador', 'mirador'),
('Parque y espacio natural', 'parque y espacio natural'),
('Cueva', 'cueva'),
('Monumento, museo y patrimonio', 'monumento, museo y patrimonio'),
('Restaurante y gastronomía', 'restaurante y gastronomia'),
('Otros planes', 'otros planes');
