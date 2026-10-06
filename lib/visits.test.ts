import { describe, expect, it } from "vitest";
import { visitPlaceSchema, visitTypeKey, visitTypeSchema } from "./visits";

describe("Por visitar: datos de un lugar", () => {
    it("acepta un tipo escrito y rechaza nombres largos o ambiguos", () => {
        expect(visitPlaceSchema.parse({ title: "Lugar", typeName: "  Jardín  " }).typeName).toBe("Jardín");
        expect(visitPlaceSchema.safeParse({ title: "Lugar", typeName: "x".repeat(81) }).success).toBe(false);
        expect(visitPlaceSchema.safeParse({ title: "Lugar", typeName: "Jardín", typeId: 2 }).success).toBe(false);
    });
    it("permite guardar solo un nombre, sin inventar coordenadas", () => {
        expect(visitPlaceSchema.parse({ title: "  Un manantial  " })).toMatchObject({
            title: "Un manantial", latitude: null, longitude: null, typeId: null, imageUrl: "",
        });
    });
    it("acepta fotos opcionales por URL, incluidas las que no tienen extensión", () => {
        for (const imageUrl of ["", "https://example.com/photo?id=1", "http://example.com/foto.jpg"]) {
            expect(visitPlaceSchema.safeParse({ title: "Lugar", imageUrl }).success).toBe(true);
        }
        expect(visitPlaceSchema.parse({ title: "Lugar", imageUrl: "  https://example.com/foto.jpg  " }).imageUrl).toBe("https://example.com/foto.jpg");
        for (const imageUrl of ["javascript:alert(1)", "data:image/svg+xml,test", "ftp://example.com/foto.jpg", "foto.jpg", "https://example.com/" + "x".repeat(2000)]) {
            expect(visitPlaceSchema.safeParse({ title: "Lugar", imageUrl }).success).toBe(false);
        }
    });
    it("rechaza nombres vacíos y enlaces que ejecutan código", () => {
        expect(visitPlaceSchema.safeParse({ title: "  " }).success).toBe(false);
        for (const sourceUrl of ["javascript:alert(1)", "data:text/html,test", "ftp://example.com", "un enlace"]) {
            expect(visitPlaceSchema.safeParse({ title: "Lugar", sourceUrl }).success).toBe(false);
        }
        expect(visitPlaceSchema.safeParse({ title: "Lugar", sourceUrl: "https://www.instagram.com/reel/ejemplo/" }).success).toBe(true);
    });
    it("requiere ambas coordenadas y comprueba sus límites", () => {
        for (const coords of [{ latitude: 42 }, { longitude: 1 }, { latitude: 91, longitude: 1 }, { latitude: 42, longitude: -181 }]) {
            expect(visitPlaceSchema.safeParse({ title: "Lugar", ...coords }).success).toBe(false);
        }
        expect(visitPlaceSchema.safeParse({ title: "Lugar", latitude: 0, longitude: 0 }).success).toBe(true);
    });
    it("normaliza nombres de tipos para evitar duplicados por acentos y espacios", () => {
        expect(visitTypeKey("  RÍO   y Lago ")).toBe(visitTypeKey("Río y lago"));
        expect(visitTypeSchema.safeParse({ name: "  " }).success).toBe(false);
    });
});
