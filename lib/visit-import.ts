import { z } from "zod";
import { visitPlaceSchema, type VisitTypeOption } from "./visits";

export const MAX_VISIT_IMPORT_PLACES = 100;
export const MAX_VISIT_IMPORT_LENGTH = 1_000_000;

const importPlaceSchema = visitPlaceSchema.safeExtend({
    visited: z.boolean().default(false),
}).strict();

export function getVisitImportExample(types: VisitTypeOption[]) {
    const availableTypes = types.filter(type => type.isActive);
    const comments = [
        "// Quiero fichas de sitios por visitar [PREGÚNTAME SOBRE QUÉ SITIOS O ZONA].",
        "// Busca información fiable en la web y devuelve solo un array JSON válido, sin bloques de código ni explicaciones.",
        "// Busca siempre una imagen bonita para el campo imageUrl.",
        "// Usa exactamente los campos del ejemplo de abajo y una ficha por sitio concreto, sin duplicados.",
        "//",
        ...(availableTypes.length
        ? ["// Categorías disponibles para typeName:", ...availableTypes.map(type => `// - ${JSON.stringify(type.name)}`)]
        : ["// Todavía no hay categorías disponibles."]),
    ];
    comments.push("// Usa uno de estos nombres, escribe uno nuevo o deja typeName vacío.");
    return `${comments.join("\n")}\n${JSON.stringify([
        {
            title: "Mirador para la próxima escapada",
            notes: "Comprobar el acceso antes de ir.",
            sourceUrl: "https://example.com/mirador",
            imageUrl: "https://example.com/fotos/mirador.jpg",
            typeName: availableTypes.find(type => type.name === "Mirador")?.name || availableTypes[0]?.name || "",
            locationName: "Sierra de Guadarrama",
            latitude: 40.791,
            longitude: -3.973,
            visited: false,
        },
        {
            title: "Un pueblo por descubrir",
            notes: "Completar la ubicación más adelante.",
            sourceUrl: "",
            imageUrl: "",
            typeName: availableTypes.find(type => type.name === "Pueblo y ciudad")?.name || availableTypes[1]?.name || availableTypes[0]?.name || "",
            locationName: "",
            latitude: null,
            longitude: null,
            visited: false,
        },
    ], null, 2)}`;
}

export type ImportedVisitPlace = z.output<typeof importPlaceSchema>;
type ParseResult = { success: true; places: ImportedVisitPlace[] } | { success: false; error: string };

const fieldLabels: Record<string, string> = {
    title: "nombre (title)", notes: "notas (notes)", sourceUrl: "enlace (sourceUrl)",
    imageUrl: "URL de la foto (imageUrl)",
    locationName: "zona (locationName)", latitude: "latitud (latitude)",
    longitude: "longitud (longitude)", typeName: "tipo (typeName)",
    typeId: "tipo (typeId)", visited: "estado (visited)",
};

// Preserve strings (including URLs) and replace comments with whitespace so
// comments cannot join two otherwise invalid JSON tokens.
function stripJsonComments(input: string) {
    let result = "";
    let state: "json" | "string" | "line" | "block" = "json";
    let escaped = false;
    for (let index = 0; index < input.length; index++) {
        const char = input[index];
        const next = input[index + 1];
        if (state === "string") {
            result += char;
            if (escaped) escaped = false;
            else if (char === "\\") escaped = true;
            else if (char === '"') state = "json";
        } else if (state === "line") {
            if (char === "\n" || char === "\r") { result += char; state = "json"; }
        } else if (state === "block") {
            if (char === "*" && next === "/") { state = "json"; index++; }
            else if (char === "\n" || char === "\r") result += char;
        } else if (char === '"') {
            result += char;
            state = "string";
        } else if (char === "/" && (next === "/" || next === "*")) {
            result += " ";
            state = next === "/" ? "line" : "block";
            index++;
        } else result += char;
    }
    if (state === "block") throw new SyntaxError("Comentario sin cerrar");
    return result;
}

export function parseVisitImport(input: unknown): ParseResult {
    if (typeof input !== "string" || !input.trim()) return { success: false, error: "Pega el JSON de uno o varios sitios." };
    if (input.length > MAX_VISIT_IMPORT_LENGTH) return { success: false, error: "El JSON es demasiado grande. Divide los sitios en varios lotes." };
    let json: unknown;
    try { json = JSON.parse(stripJsonComments(input)); }
    catch { return { success: false, error: "El JSON no es válido. Revisa las comas, las llaves y las comillas dobles. Puedes copiar el ejemplo para comprobar el formato." }; }
    const items = Array.isArray(json) ? json : [json];
    if (!items.length || items.length > MAX_VISIT_IMPORT_PLACES) {
        return { success: false, error: `Incluye de 1 a ${MAX_VISIT_IMPORT_PLACES} sitios por importación.` };
    }
    const places: ImportedVisitPlace[] = [];
    for (const [index, item] of items.entries()) {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
            return { success: false, error: `El sitio ${index + 1} debe ser un objeto con sus campos, como en el ejemplo.` };
        }
        const parsed = importPlaceSchema.safeParse(item);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            const field = String(issue.path[0] ?? "");
            const reason = issue.code === "unrecognized_keys"
                ? `Campos desconocidos: ${issue.keys.join(", ")}. Usa los nombres del ejemplo.`
                : issue.code === "invalid_type"
                    ? "Comprueba el tipo de dato: textos entre comillas, coordenadas como números o null y visited como true o false."
                    : issue.code === "too_big" || issue.code === "too_small"
                        ? "El valor está vacío o fuera de los límites permitidos. Revisa la longitud del texto y los límites de las coordenadas."
                        : issue.message;
            return { success: false, error: `Sitio ${index + 1}${field ? `, ${fieldLabels[field] || field}` : ""}: ${reason}` };
        }
        places.push(parsed.data);
    }
    return { success: true, places };
}
