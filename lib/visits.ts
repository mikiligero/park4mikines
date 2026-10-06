import { z } from "zod";

export const visitPlaceSchema = z.object({
    title: z.string().trim().min(1, "Escribe un nombre para el lugar.").max(200),
    notes: z.string().trim().max(2000).default(""),
    sourceUrl: z.string().trim().max(2000).refine(value => {
        if (!value) return true;
        try { return ["http:", "https:"].includes(new URL(value).protocol); }
        catch { return false; }
    }, "Introduce un enlace completo que empiece por https:// o http://.").default(""),
    imageUrl: z.string().trim().max(2000).refine(value => {
        if (!value) return true;
        try { return ["http:", "https:"].includes(new URL(value).protocol); }
        catch { return false; }
    }, "Introduce una URL de imagen que empiece por https:// o http://.").default(""),
    locationName: z.string().trim().max(300).default(""),
    latitude: z.number().min(-90).max(90).nullable().default(null),
    longitude: z.number().min(-180).max(180).nullable().default(null),
    typeId: z.number().int().positive().nullable().default(null),
    typeName: z.string().trim().max(80, "El tipo de lugar no puede superar los 80 caracteres.").default(""),
}).refine(data => (data.latitude === null) === (data.longitude === null), {
    message: "Indica latitud y longitud, o deja ambas vacías.", path: ["latitude"],
}).refine(data => data.typeId === null || !data.typeName, {
    message: "Elige un tipo existente o escribe uno nuevo.", path: ["typeName"],
});

export const visitTypeSchema = z.object({
    name: z.string().trim().min(1, "Escribe un nombre para el tipo.").max(80),
});

export function visitTypeKey(name: string) {
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

export type VisitPlaceInput = z.input<typeof visitPlaceSchema>;
export type VisitTypeOption = { id: number; name: string; isActive: boolean };
export type VisitPlaceItem = {
    id: number; title: string; notes: string | null; sourceUrl: string | null; imageUrl: string | null;
    locationName: string | null; latitude: number | null; longitude: number | null;
    visited: boolean; typeId: number | null; type: VisitTypeOption | null;
    authorId: number;
};
