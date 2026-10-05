"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { visitPlaceSchema, visitTypeSchema, visitTypeKey } from "@/lib/visits";
import { parseVisitImport } from "@/lib/visit-import";

class VisitTypeError extends Error {}

async function resolveVisitType(tx: Prisma.TransactionClient, typeName: string, typeId: number | null, existingTypeId?: number | null) {
    if (typeName) {
        const name = typeName.replace(/\s+/g, " ");
        const type = await tx.visitType.upsert({
            where: { nameKey: visitTypeKey(name) }, update: {},
            create: { name, nameKey: visitTypeKey(name) },
        });
        if (!type.isActive && existingTypeId !== type.id) {
            throw new VisitTypeError(`El tipo «${type.name || name}» está oculto. Elige otro tipo.`);
        }
        return type.id;
    }
    if (typeId !== null) {
        const type = await tx.visitType.findUnique({ where: { id: typeId } });
        if (!type || (!type.isActive && existingTypeId !== type.id)) throw new VisitTypeError("Elige un tipo disponible.");
    }
    return typeId;
}

function refreshVisits() {
    for (const path of ["/por-visitar", "/pois", "/", "/settings"]) revalidatePath(path);
}

export async function getVisitPlaces() {
    const session = await getSession();
    if (!session?.userId) return [];
    return prisma.visitPlace.findMany({ include: { type: true }, orderBy: { createdAt: "desc" } });
}

export async function saveVisitPlace(id: number | null, input: unknown) {
    const session = await getSession();
    if (!session?.userId) return { success: false, error: "Inicia sesión para guardar lugares." };
    const parsed = visitPlaceSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
    if (id !== null && (!Number.isInteger(id) || id < 1)) return { success: false, error: "Lugar inválido." };

    try {
        const result = await prisma.$transaction(async tx => {
            const existing = id === null ? null : await tx.visitPlace.findUnique({ where: { id } });
            if (id !== null && (!existing || (existing.authorId !== session.userId && session.role !== "ADMIN"))) {
                return { success: false, error: "No puedes editar este lugar." };
            }
            const { typeName, typeId: requestedTypeId, ...placeData } = parsed.data;
            const typeId = await resolveVisitType(tx, typeName, requestedTypeId, existing?.typeId);
            if (id === null) {
                await tx.visitPlace.create({ data: { ...placeData, typeId, authorId: Number(session.userId) } });
            } else {
                await tx.visitPlace.update({ where: { id }, data: { ...placeData, typeId } });
            }
            return { success: true };
        });
        if (!result.success) return result;
        refreshVisits();
        return result;
    } catch (error) {
        if (error instanceof VisitTypeError) return { success: false, error: error.message };
        return { success: false, error: "No se ha podido guardar el lugar. Inténtalo de nuevo." };
    }
}

export async function importVisitPlaces(input: unknown): Promise<{ success: true; count: number } | { success: false; error: string }> {
    const session = await getSession();
    if (!session?.userId) return { success: false, error: "Inicia sesión para importar sitios." };
    const parsed = parseVisitImport(input);
    if (!parsed.success) return parsed;
    try {
        await prisma.$transaction(async tx => {
            for (const [index, place] of parsed.places.entries()) {
                const { typeName, typeId: requestedTypeId, ...data } = place;
                let typeId: number | null;
                try { typeId = await resolveVisitType(tx, typeName, requestedTypeId); }
                catch (error) {
                    if (error instanceof VisitTypeError) throw new VisitTypeError(`Sitio ${index + 1} («${place.title}»): ${error.message}`);
                    throw error;
                }
                await tx.visitPlace.create({ data: { ...data, typeId, authorId: Number(session.userId) } });
            }
        }, { timeout: 15000 });
        refreshVisits();
        return { success: true, count: parsed.places.length };
    } catch (error) {
        return { success: false, error: error instanceof VisitTypeError ? error.message : "No se han importado sitios. Inténtalo de nuevo." };
    }
}

export async function setVisitPlaceVisited(id: number, visited: boolean) {
    const session = await getSession();
    if (!session?.userId) return { success: false, error: "Inicia sesión para cambiar el estado." };
    if (!Number.isInteger(id) || id < 1 || typeof visited !== "boolean") return { success: false, error: "Datos inválidos." };
    try {
        const result = await prisma.visitPlace.updateMany({
            where: { id, ...(session.role === "ADMIN" ? {} : { authorId: Number(session.userId) }) },
            data: { visited },
        });
        if (!result.count) return { success: false, error: "No puedes cambiar este lugar." };
        refreshVisits();
        return { success: true };
    } catch {
        return { success: false, error: "No se ha podido cambiar el estado." };
    }
}

export async function saveVisitType(id: number | null, input: unknown) {
    const session = await getSession();
    if (!session?.userId || session.role !== "ADMIN") return { success: false, error: "Solo los administradores pueden gestionar tipos." };
    const parsed = visitTypeSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
    if (id !== null && (!Number.isInteger(id) || id < 1)) return { success: false, error: "Tipo inválido." };
    const data = { name: parsed.data.name.replace(/\s+/g, " "), nameKey: visitTypeKey(parsed.data.name) };
    try {
        if (id === null) await prisma.visitType.create({ data });
        else await prisma.visitType.update({ where: { id }, data });
        refreshVisits();
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
            ? "Ya existe un tipo con ese nombre, también puede estar oculto."
            : "No se ha podido guardar el tipo." };
    }
}

export async function setVisitTypeActive(id: number, isActive: boolean) {
    const session = await getSession();
    if (!session?.userId || session.role !== "ADMIN") return { success: false, error: "Solo los administradores pueden gestionar tipos." };
    if (!Number.isInteger(id) || id < 1 || typeof isActive !== "boolean") return { success: false, error: "Datos inválidos." };
    try {
        await prisma.visitType.update({ where: { id }, data: { isActive } });
        refreshVisits();
        return { success: true };
    } catch {
        return { success: false, error: "No se ha podido actualizar el tipo." };
    }
}

export async function deleteVisitType(id: number) {
    const session = await getSession();
    if (!session?.userId || session.role !== "ADMIN") return { success: false, error: "Solo los administradores pueden gestionar tipos." };
    if (!Number.isSafeInteger(id) || id < 1) return { success: false, error: "Tipo inválido." };
    try {
        // The relation uses ON DELETE SET NULL: saved places are preserved.
        await prisma.visitType.delete({ where: { id } });
        refreshVisits();
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025"
            ? "Este tipo ya no existe. Actualiza la página."
            : "No se ha podido eliminar el tipo. Inténtalo de nuevo." };
    }
}
