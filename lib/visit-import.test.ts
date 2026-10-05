import { describe, expect, it } from "vitest";
import { MAX_VISIT_IMPORT_LENGTH, MAX_VISIT_IMPORT_PLACES, VISIT_IMPORT_EXAMPLE, parseVisitImport } from "./visit-import";

describe("Importación de sitios desde JSON", () => {
    it("acepta un sitio con solo su nombre y completa los valores opcionales", () => {
        expect(parseVisitImport('{"title":"  Un pueblo  "}')).toMatchObject({
            success: true, places: [{ title: "Un pueblo", latitude: null, longitude: null, visited: false, typeId: null }],
        });
    });
    it("acepta el ejemplo copiable con varios sitios y coordenadas opcionales", () => {
        const result = parseVisitImport(VISIT_IMPORT_EXAMPLE);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.places).toHaveLength(2);
            expect(result.places[0].latitude).not.toBeNull();
            expect(result.places[1].latitude).toBeNull();
        }
    });
    it("conserva el estado visitado y las coordenadas cero", () => {
        expect(parseVisitImport('{"title":"Lugar","latitude":0,"longitude":0,"visited":true}')).toMatchObject({
            success: true, places: [{ latitude: 0, longitude: 0, visited: true }],
        });
    });
    it("identifica el sitio incorrecto antes de importar el lote", () => {
        const result = parseVisitImport(JSON.stringify([{ title: "Correcto" }, { title: "Incompleto", latitude: 40 }]));
        expect(result).toMatchObject({ success: false, error: expect.stringContaining("Sitio 2") });
    });
    it("rechaza datos ambiguos, campos desconocidos y enlaces peligrosos", () => {
        for (const place of [
            { title: "Lugar", latitude: "40", longitude: -3 },
            { title: "Lugar", latitude: 91, longitude: 0 },
            { title: "Lugar", visited: "false" },
            { title: "Lugar", sourceUrl: "javascript:alert(1)" },
            { title: "Lugar", authorId: 99 },
            { title: "Lugar", id: 1 },
            { title: "Lugar", nombre: "Otro nombre" },
            { title: "Lugar", typeId: 1, typeName: "Mirador" },
        ]) expect(parseVisitImport(JSON.stringify(place)).success).toBe(false);
    });
    it("rechaza JSON mal formado, valores sueltos y lotes vacíos o demasiado grandes", () => {
        for (const input of ["", "{", "null", "true", "42", '"sitio"', "[]", "[null]", "[[]]"]) {
            expect(parseVisitImport(input).success).toBe(false);
        }
        expect(parseVisitImport(JSON.stringify(Array.from({ length: MAX_VISIT_IMPORT_PLACES + 1 }, () => ({ title: "Lugar" })))).success).toBe(false);
        expect(parseVisitImport(" ".repeat(MAX_VISIT_IMPORT_LENGTH) + "{}").success).toBe(false);
        expect(parseVisitImport({ title: "Lugar" }).success).toBe(false);
    });
});
