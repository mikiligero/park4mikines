import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const { session, db } = vi.hoisted(() => ({
    session: vi.fn(),
    db: {
        visitPlace: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
        visitType: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), upsert: vi.fn() },
        $transaction: vi.fn(),
    },
}));
vi.mock("@/lib/auth", () => ({ getSession: session }));
vi.mock("@/lib/prisma", () => ({ default: db }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { deleteVisitPlace, deleteVisitType, getVisitPlaces, importVisitPlaces, saveVisitPlace, saveVisitType, setVisitPlaceVisited, setVisitTypeActive } from "./visit-actions";

beforeEach(() => {
    vi.resetAllMocks();
    db.$transaction.mockImplementation(async action => action(db));
    session.mockResolvedValue({ userId: 7, role: "USER" });
    db.visitPlace.findUnique.mockResolvedValue({ id: 4, authorId: 7, typeId: 2 });
    db.visitType.findUnique.mockResolvedValue({ id: 2, isActive: true });
    db.visitType.upsert.mockResolvedValue({ id: 12, isActive: true });
    db.visitPlace.updateMany.mockResolvedValue({ count: 1 });
});

describe("Permisos y persistencia de Por visitar", () => {
    it("crea un tipo nuevo al guardar un lugar con un usuario autenticado", async () => {
        expect((await saveVisitPlace(null, { title: "Lugar", typeName: " Jardín   botánico " })).success).toBe(true);
        expect(db.visitType.upsert).toHaveBeenCalledWith({
            where: { nameKey: "jardin botanico" }, update: {}, create: { name: "Jardín botánico", nameKey: "jardin botanico" },
        });
        expect(db.visitPlace.create).toHaveBeenCalledWith({ data: expect.objectContaining({ typeId: 12, authorId: 7 }) });
        expect(db.visitPlace.create.mock.calls[0][0].data).not.toHaveProperty("typeName");
    });
    it("reutiliza el tipo equivalente al editar y no lo renombra", async () => {
        db.visitType.upsert.mockResolvedValue({ id: 2, isActive: true });
        expect((await saveVisitPlace(4, { title: "Lugar", typeName: "  RÍO  " })).success).toBe(true);
        expect(db.visitType.upsert).toHaveBeenCalledWith({ where: { nameKey: "rio" }, update: {}, create: { name: "RÍO", nameKey: "rio" } });
        expect(db.visitPlace.update).toHaveBeenCalledWith({ where: { id: 4 }, data: expect.objectContaining({ typeId: 2 }) });
    });
    it("no crea tipos al intentar editar un lugar ajeno", async () => {
        db.visitPlace.findUnique.mockResolvedValue({ id: 4, authorId: 8 });
        expect((await saveVisitPlace(4, { title: "Cambio", typeName: "Nuevo tipo" })).success).toBe(false);
        expect(db.visitType.upsert).not.toHaveBeenCalled();
    });
    it("no reactiva un tipo oculto escribiendo su nombre", async () => {
        db.visitType.upsert.mockResolvedValue({ id: 12, isActive: false });
        expect((await saveVisitPlace(null, { title: "Lugar", typeName: "Cueva" })).success).toBe(false);
        expect(db.visitPlace.create).not.toHaveBeenCalled();
    });
    it("no crea un tipo para un formulario inválido", async () => {
        expect((await saveVisitPlace(null, { title: " ", typeName: "Nuevo tipo" })).success).toBe(false);
        expect(db.visitType.upsert).not.toHaveBeenCalled();
    });
    it("permite dejar el tipo vacío al editar", async () => {
        expect((await saveVisitPlace(4, { title: "Lugar", typeName: " " })).success).toBe(true);
        expect(db.visitType.upsert).not.toHaveBeenCalled();
        expect(db.visitPlace.update).toHaveBeenCalledWith({ where: { id: 4 }, data: expect.objectContaining({ typeId: null }) });
    });
    it("no expone ni modifica lugares sin sesión", async () => {
        session.mockResolvedValue(null);
        expect(await getVisitPlaces()).toEqual([]);
        expect((await saveVisitPlace(null, { title: "Lugar" })).success).toBe(false);
        expect((await saveVisitPlace(null, { title: "Lugar", typeName: "Nuevo tipo" })).success).toBe(false);
        expect((await setVisitPlaceVisited(4, true)).success).toBe(false);
        expect(db.visitPlace.create).not.toHaveBeenCalled();
        expect(db.visitPlace.findMany).not.toHaveBeenCalled();
        expect(db.visitPlace.updateMany).not.toHaveBeenCalled();
        expect(db.visitType.upsert).not.toHaveBeenCalled();
    });
    it("asigna el autor de la sesión y permite un lugar sin ubicación", async () => {
        expect((await saveVisitPlace(null, { title: "Ruta", authorId: 99 })).success).toBe(true);
        expect(db.visitPlace.create).toHaveBeenCalledWith({ data: expect.objectContaining({ authorId: 7, latitude: null, longitude: null }) });
    });
    it("impide editar sitios de otro usuario", async () => {
        db.visitPlace.findUnique.mockResolvedValue({ id: 4, authorId: 8 });
        expect((await saveVisitPlace(4, { title: "Cambio" })).success).toBe(false);
        expect(db.visitPlace.update).not.toHaveBeenCalled();
    });
    it("permite al administrador editar un lugar compartido", async () => {
        session.mockResolvedValue({ userId: 1, role: "ADMIN" });
        expect((await saveVisitPlace(4, { title: "Cambio" })).success).toBe(true);
    });
    it("rechaza tipos inexistentes y tipos ocultos para nuevos lugares", async () => {
        db.visitType.findUnique.mockResolvedValue(null);
        expect((await saveVisitPlace(null, { title: "Lugar", typeId: 999 })).success).toBe(false);
        db.visitType.findUnique.mockResolvedValue({ id: 2, isActive: false });
        expect((await saveVisitPlace(null, { title: "Lugar", typeId: 2 })).success).toBe(false);
        expect(db.visitPlace.create).not.toHaveBeenCalled();
    });
    it("conserva un tipo oculto al editar un lugar que ya lo usa", async () => {
        db.visitType.findUnique.mockResolvedValue({ id: 2, isActive: false });
        expect((await saveVisitPlace(4, { title: "Lugar", typeId: 2 })).success).toBe(true);
    });
    it("restringe el cambio de estado al propietario y permite deshacerlo", async () => {
        await setVisitPlaceVisited(4, true);
        expect(db.visitPlace.updateMany).toHaveBeenLastCalledWith({ where: { id: 4, authorId: 7 }, data: { visited: true } });
        await setVisitPlaceVisited(4, false);
        expect(db.visitPlace.updateMany).toHaveBeenLastCalledWith({ where: { id: 4, authorId: 7 }, data: { visited: false } });
        db.visitPlace.updateMany.mockResolvedValue({ count: 0 });
        expect((await setVisitPlaceVisited(5, true)).success).toBe(false);
    });
    it("rechaza datos inválidos sin escribir en la base de datos", async () => {
        expect((await saveVisitPlace(null, { title: "Lugar", latitude: 45 })).success).toBe(false);
        expect(db.visitPlace.create).not.toHaveBeenCalled();
    });
    it("devuelve un error recuperable si falla el guardado", async () => {
        db.visitPlace.create.mockRejectedValue(new Error("DB offline"));
        expect((await saveVisitPlace(null, { title: "Lugar" })).success).toBe(false);
    });
});

describe("Eliminación de sitios", () => {
    it("requiere sesión y un identificador válido antes de borrar", async () => {
        session.mockResolvedValue(null);
        expect((await deleteVisitPlace(4)).success).toBe(false);
        session.mockResolvedValue({ userId: 7, role: "USER" });
        for (const id of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
            expect((await deleteVisitPlace(id)).success).toBe(false);
        }
        expect(db.visitPlace.deleteMany).not.toHaveBeenCalled();
    });
    it("restringe el borrado al autor y rechaza lugares ajenos o inexistentes", async () => {
        db.visitPlace.deleteMany.mockResolvedValue({ count: 1 });
        expect((await deleteVisitPlace(4)).success).toBe(true);
        expect(db.visitPlace.deleteMany).toHaveBeenCalledWith({ where: { id: 4, authorId: 7 } });
        db.visitPlace.deleteMany.mockResolvedValue({ count: 0 });
        expect((await deleteVisitPlace(5)).success).toBe(false);
    });
    it("permite al administrador borrar un sitio compartido", async () => {
        session.mockResolvedValue({ userId: 1, role: "ADMIN" });
        db.visitPlace.deleteMany.mockResolvedValue({ count: 1 });
        expect((await deleteVisitPlace(4)).success).toBe(true);
        expect(db.visitPlace.deleteMany).toHaveBeenCalledWith({ where: { id: 4 } });
    });
    it("informa del fallo sin declarar eliminado el sitio", async () => {
        db.visitPlace.deleteMany.mockRejectedValue(new Error("DB offline"));
        expect((await deleteVisitPlace(4)).success).toBe(false);
    });
});

describe("Importación por lotes", () => {
    it("requiere sesión antes de importar", async () => {
        session.mockResolvedValue(null);
        expect((await importVisitPlaces('{"title":"Lugar"}')).success).toBe(false);
        expect(db.$transaction).not.toHaveBeenCalled();
    });
    it("valida todos los sitios antes de escribir", async () => {
        expect((await importVisitPlaces('[{"title":"Correcto"},{"title":"Incorrecto","latitude":45}]')).success).toBe(false);
        expect(db.$transaction).not.toHaveBeenCalled();
        expect(db.visitPlace.create).not.toHaveBeenCalled();
    });
    it("asigna el autor autenticado, conserva el estado y crea el tipo", async () => {
        expect(await importVisitPlaces('[{"title":"Uno","typeName":"Jardín"},{"title":"Dos","visited":true}]')).toEqual({ success: true, count: 2 });
        expect(db.visitPlace.create).toHaveBeenNthCalledWith(1, { data: expect.objectContaining({ title: "Uno", authorId: 7, typeId: 12, visited: false }) });
        expect(db.visitPlace.create).toHaveBeenNthCalledWith(2, { data: expect.objectContaining({ title: "Dos", authorId: 7, typeId: null, visited: true }) });
        expect(db.visitPlace.create.mock.calls[0][0].data).not.toHaveProperty("typeName");
    });
    it("rechaza tipos ocultos con un error que identifica el sitio", async () => {
        db.visitType.upsert.mockResolvedValue({ id: 12, name: "Cueva", isActive: false });
        expect(await importVisitPlaces('{"title":"Lugar","typeName":"Cueva"}')).toMatchObject({ success: false, error: expect.stringContaining("Sitio 1") });
        expect(db.visitPlace.create).not.toHaveBeenCalled();
    });
});

describe("Gestión de tipos", () => {
    it("impide eliminar tipos sin sesión o sin permisos de administrador", async () => {
        expect((await deleteVisitType(2)).success).toBe(false);
        session.mockResolvedValue(null);
        expect((await deleteVisitType(2)).success).toBe(false);
        expect(db.visitType.delete).not.toHaveBeenCalled();
    });
    it("rechaza identificadores inválidos antes de eliminar", async () => {
        session.mockResolvedValue({ userId: 1, role: "ADMIN" });
        for (const id of [0, -1, 1.5, NaN, Infinity]) {
            expect((await deleteVisitType(id)).success).toBe(false);
        }
        expect(db.visitType.delete).not.toHaveBeenCalled();
    });
    it("permite al administrador eliminar el tipo", async () => {
        session.mockResolvedValue({ userId: 1, role: "ADMIN" });
        expect((await deleteVisitType(2)).success).toBe(true);
        expect(db.visitType.delete).toHaveBeenCalledWith({ where: { id: 2 } });
    });
    it("informa si otro administrador ya eliminó el tipo", async () => {
        session.mockResolvedValue({ userId: 1, role: "ADMIN" });
        db.visitType.delete.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("Missing record", { code: "P2025", clientVersion: "5.22.0" }));
        expect(await deleteVisitType(2)).toMatchObject({ success: false, error: "Este tipo ya no existe. Actualiza la página." });
    });
    it("devuelve un error recuperable si falla la eliminación", async () => {
        session.mockResolvedValue({ userId: 1, role: "ADMIN" });
        db.visitType.delete.mockRejectedValue(new Error("DB offline"));
        expect((await deleteVisitType(2)).success).toBe(false);
    });
    it("requiere administrador para crear, renombrar u ocultar", async () => {
        expect((await saveVisitType(null, { name: "Jardín" })).success).toBe(false);
        expect((await saveVisitType(2, { name: "Jardín" })).success).toBe(false);
        expect((await setVisitTypeActive(2, false)).success).toBe(false);
        expect(db.visitType.create).not.toHaveBeenCalled();
        expect(db.visitType.update).not.toHaveBeenCalled();
    });
    it("crea un tipo normalizado y oculta sin borrar lugares", async () => {
        session.mockResolvedValue({ userId: 1, role: "ADMIN" });
        expect((await saveVisitType(null, { name: "  Jardín  botánico " })).success).toBe(true);
        expect(db.visitType.create).toHaveBeenCalledWith({ data: { name: "Jardín botánico", nameKey: "jardin botanico" } });
        expect((await setVisitTypeActive(2, false)).success).toBe(true);
        expect(db.visitType.update).toHaveBeenCalledWith({ where: { id: 2 }, data: { isActive: false } });
        expect(db.visitPlace.updateMany).not.toHaveBeenCalled();
    });
});
