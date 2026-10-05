import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { readFile, rm } from "node:fs/promises";
import path from "node:path";

const state = vi.hoisted(() => ({ directory: "", userId: 7 }));
vi.mock("@/lib/auth", () => ({ getSession: async () => ({ userId: state.userId, role: "USER" }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", async () => {
    const { PrismaClient } = await import("@prisma/client");
    const { mkdtempSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    state.directory = mkdtempSync(join(tmpdir(), "park4mikines-visit-types-"));
    return { default: new PrismaClient({ datasources: { db: { url: `file:${join(state.directory, "test.db")}` } } }) };
});

import prisma from "@/lib/prisma";
import { importVisitPlaces, saveVisitPlace } from "./visit-actions";

beforeAll(async () => {
    await prisma.$executeRawUnsafe('CREATE TABLE "User" ("id" INTEGER PRIMARY KEY)');
    await prisma.$executeRawUnsafe('INSERT INTO "User" ("id") VALUES (7)');
    const migration = await readFile(path.join(process.cwd(), "prisma/migrations/20260918120000_add_visit_places/migration.sql"), "utf8");
    for (const statement of migration.split(";").map(sql => sql.trim()).filter(Boolean)) {
        await prisma.$executeRawUnsafe(statement);
    }
});

afterAll(async () => {
    await prisma.$disconnect();
    if (state.directory) await rm(state.directory, { recursive: true, force: true });
});

describe("Guardado de tipos y lugares en SQLite", () => {
    it("crea el tipo, lo reutiliza por nombre y permite otro nuevo al editar", async () => {
        expect((await saveVisitPlace(null, { title: "Primer jardín", typeName: " Jardín   botánico " })).success).toBe(true);
        expect((await saveVisitPlace(null, { title: "Segundo jardín", typeName: "JARDIN BOTANICO" })).success).toBe(true);
        const places = await prisma.visitPlace.findMany({ include: { type: true }, orderBy: { id: "asc" } });
        expect(places).toHaveLength(2);
        expect(places[0].type?.name).toBe("Jardín botánico");
        expect(places[1].typeId).toBe(places[0].typeId);
        expect(await prisma.visitType.count({ where: { nameKey: "jardin botanico" } })).toBe(1);

        expect((await saveVisitPlace(places[0].id, { title: "Primer jardín", typeName: "Jardín histórico" })).success).toBe(true);
        const edited = await prisma.visitPlace.findUniqueOrThrow({ where: { id: places[0].id }, include: { type: true } });
        expect(edited.type?.name).toBe("Jardín histórico");
        expect((await prisma.visitPlace.findUniqueOrThrow({ where: { id: places[1].id } })).typeId).toBe(places[1].typeId);
    });

    it("revierte el tipo nuevo cuando falla la creación del lugar", async () => {
        const before = await prisma.visitPlace.count();
        state.userId = 999; // Simulate a user deleted after authentication.
        try {
            expect((await saveVisitPlace(null, { title: "No debe guardarse", typeName: "Tipo para revertir" })).success).toBe(false);
            expect(await prisma.visitType.count({ where: { nameKey: "tipo para revertir" } })).toBe(0);
            expect(await prisma.visitPlace.count()).toBe(before);
        } finally { state.userId = 7; }
    });

    it("importa varios sitios y reutiliza tipos equivalentes dentro del lote", async () => {
        const result = await importVisitPlaces(JSON.stringify([
            { title: "Importado uno", typeName: "Plan   familiar", latitude: 40, longitude: -3 },
            { title: "Importado dos", typeName: "PLAN FAMILIAR", visited: true },
        ]));
        expect(result).toEqual({ success: true, count: 2 });
        const places = await prisma.visitPlace.findMany({ where: { title: { startsWith: "Importado " } }, orderBy: { id: "asc" } });
        expect(places).toHaveLength(2);
        expect(places[0].typeId).toBe(places[1].typeId);
        expect(places[0].authorId).toBe(7);
        expect(places[1].visited).toBe(true);
        expect(places[1].latitude).toBeNull();
    });

    it("revierte sitios y tipos nuevos si falla un sitio posterior del lote", async () => {
        const hidden = await prisma.visitType.create({ data: { name: "Oculto para importar", nameKey: "oculto para importar", isActive: false } });
        const before = await prisma.visitPlace.count();
        const result = await importVisitPlaces(JSON.stringify([
            { title: "Debe revertirse", typeName: "Tipo de lote para revertir" },
            { title: "No se puede importar", typeId: hidden.id },
        ]));
        expect(result).toMatchObject({ success: false, error: expect.stringContaining("Sitio 2") });
        expect(await prisma.visitPlace.count()).toBe(before);
        expect(await prisma.visitType.count({ where: { nameKey: "tipo de lote para revertir" } })).toBe(0);
    });
});
