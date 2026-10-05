"use client";

import { useMemo, useRef, useState } from "react";
import { importVisitPlaces } from "@/lib/visit-actions";
import { MAX_VISIT_IMPORT_PLACES, MAX_VISIT_IMPORT_LENGTH, VISIT_IMPORT_EXAMPLE, parseVisitImport } from "@/lib/visit-import";

export default function VisitPlaceImport({ onSaved, onCancel }: { onSaved: (count: number) => void; onCancel: () => void }) {
    const [text, setText] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [copyMessage, setCopyMessage] = useState("");
    const exampleRef = useRef<HTMLTextAreaElement>(null);
    const preview = useMemo(() => parseVisitImport(text), [text]);

    async function copyExample() {
        try {
            await navigator.clipboard.writeText(VISIT_IMPORT_EXAMPLE);
            setCopyMessage("Ejemplo copiado.");
        } catch {
            exampleRef.current?.focus();
            exampleRef.current?.select();
            setCopyMessage("Selecciona el texto del ejemplo y cópialo con el menú de tu dispositivo.");
        }
    }

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy || !preview.success) return;
        setBusy(true); setError("");
        try {
            const result = await importVisitPlaces(text);
            if (result.success) onSaved(result.count);
            else setError(result.error || "No se han podido importar los sitios.");
        } catch { setError("No se ha podido conectar. El JSON se conserva para que puedas volver a intentarlo."); }
        finally { setBusy(false); }
    }

    return <section className="visit-panel visit-import" aria-labelledby="visit-import-title">
        <h2 id="visit-import-title">Importar sitios desde JSON</h2>
        <p className="visit-muted">Pega un objeto para añadir un sitio o una lista entre corchetes para añadir varios. Solo <code>title</code> es obligatorio. Puedes importar hasta {MAX_VISIT_IMPORT_PLACES} sitios a la vez.</p>
        <details className="visit-import-example" open>
            <summary>Formato de ejemplo</summary>
            <p className="visit-muted">Las coordenadas son números o <code>null</code>. Usa <code>typeName</code> para elegir o crear un tipo. <code>visited</code> admite <code>true</code> o <code>false</code>; si lo omites, el sitio queda pendiente.</p>
            <label htmlFor="visit-import-example">JSON de ejemplo</label>
            <textarea ref={exampleRef} id="visit-import-example" className="input visit-json" value={VISIT_IMPORT_EXAMPLE} readOnly rows={6} spellCheck={false} />
            <button className="btn btn-soft btn-sm" type="button" onClick={() => void copyExample()}>Copiar ejemplo JSON</button>
            <p role="status" className="visit-muted">{copyMessage}</p>
        </details>
        <form onSubmit={submit}>
            <fieldset disabled={busy} className="visit-form-fields">
                <label htmlFor="visit-import-input">Pega aquí tus sitios en JSON
                    <textarea id="visit-import-input" className="input visit-json" value={text} onChange={event => { setText(event.target.value); setError(""); }} maxLength={MAX_VISIT_IMPORT_LENGTH} rows={8} spellCheck={false} placeholder={'{ "title": "Un sitio por visitar" }'} aria-describedby="visit-import-help" required />
                </label>
                <p id="visit-import-help" className="visit-muted">Se crearán sitios nuevos. Si algún sitio es incorrecto, se conservará el JSON y no se guardará ninguno.</p>
                {text.trim() && !preview.success && <p role="status" className="visit-error">{preview.error}</p>}
                {text.trim() && preview.success && <div className="visit-import-preview" aria-label="Sitios listos para importar">
                    <p><strong>{preview.places.length} {preview.places.length === 1 ? "sitio listo" : "sitios listos"} para importar</strong></p>
                    <ul>{preview.places.map((place, index) => <li key={index}><strong>{place.title}</strong><span className="visit-muted">{place.visited ? "Visitado" : "Pendiente"} · {place.latitude === null ? "Sin ubicación en el mapa" : "Con coordenadas"}{place.typeName ? ` · ${place.typeName}` : ""}</span></li>)}</ul>
                </div>}
                {error && <p role="alert" className="visit-error">{error}</p>}
                <div className="visit-actions">
                    <button className="btn btn-primary btn-md" disabled={!preview.success || busy}>{busy ? "Importando…" : preview.success ? `Importar ${preview.places.length} ${preview.places.length === 1 ? "sitio" : "sitios"}` : "Importar sitios"}</button>
                    <button type="button" className="btn btn-ghost btn-md" onClick={onCancel}>Cancelar</button>
                </div>
            </fieldset>
        </form>
    </section>;
}
