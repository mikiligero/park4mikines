import { describe, expect, it } from "vitest";
import { MAX_VISIT_IMPORT_LENGTH, MAX_VISIT_IMPORT_PLACES, getVisitImportExample, parseVisitImport } from "./visit-import";

describe("Importación de sitios desde JSON", () => {
    it("acepta un sitio con solo su nombre y completa los valores opcionales", () => {
        expect(parseVisitImport('{"title":"  Un pueblo  "}')).toMatchObject({
            success: true, places: [{ title: "Un pueblo", latitude: null, longitude: null, visited: false, typeId: null }],
        });
    });
    it("acepta el ejemplo copiable con varios sitios y coordenadas opcionales", () => {
        const result = parseVisitImport(getVisitImportExample([
            { id: 1, name: "Mirador", isActive: true },
            { id: 2, name: "Pueblo y ciudad", isActive: true },
        ]));
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.places).toHaveLength(2);
            expect(result.places[0].latitude).not.toBeNull();
            expect(result.places[1].latitude).toBeNull();
            expect(result.places[0].imageUrl).toBe("https://example.com/fotos/mirador.jpg");
            expect(result.places[1].imageUrl).toBe("");
        }
    });
    it("incluye las categorías actuales en comentarios y excluye las ocultas", () => {
        const example = getVisitImportExample([
            { id: 1, name: 'Jardín "botánico"', isActive: true },
            { id: 2, name: "Museo renombrado", isActive: true },
            { id: 3, name: "Tipo oculto", isActive: false },
        ]);
        expect(example).toContain('// - "Jardín \\"botánico\\""');
        expect(example).toContain('// - "Museo renombrado"');
        expect(example).not.toContain("Tipo oculto");
        expect(parseVisitImport(example)).toMatchObject({
            success: true, places: [{ typeName: 'Jardín "botánico"' }, { typeName: "Museo renombrado" }],
        });
        expect(parseVisitImport(getVisitImportExample([]))).toMatchObject({
            success: true, places: [{ typeName: "" }, { typeName: "" }],
        });
    });
    it("admite comentarios sin alterar enlaces, notas ni comillas escapadas", () => {
        const place = {
            title: 'Mirador "del río"', notes: 'Conservar // y /* esto */ y una barra \\"',
            imageUrl: "https://example.com/foto.jpg?token=a//b", sourceUrl: "https://example.com/ruta",
        };
        expect(parseVisitImport(`// Categorías disponibles\n/* Referencia */\n[${JSON.stringify(place)}] // fin`)).toMatchObject({
            success: true, places: [place],
        });
        expect(parseVisitImport('{"title": /* nombre */ "Lugar" // nota\r\n}')).toMatchObject({ success: true });
    });
    it("rechaza comentarios sin cerrar y no une números separados por comentarios", () => {
        for (const input of [
            '{"title":"Lugar"} /* comentario abierto',
            '{"title":"Lugar", "latitude": 4/* separador */0, "longitude": 0}',
        ]) expect(parseVisitImport(input).success).toBe(false);
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
            { title: "Lugar", imageUrl: "javascript:alert(1)" },
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
