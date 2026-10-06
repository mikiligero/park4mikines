"use client";

import { useEffect, useId, useState } from "react";
import { saveVisitPlace } from "@/lib/visit-actions";
import { visitTypeKey, type VisitPlaceItem, type VisitTypeOption } from "@/lib/visits";
import VisitPlaceImage from "@/components/VisitPlaceImage";

type PlaceResult = { displayName: string; lat: number; lng: number };

export default function VisitPlaceForm({ place, types, onSaved, onCancel }: {
    place: VisitPlaceItem | null; types: VisitTypeOption[]; onSaved: () => void; onCancel: () => void;
}) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [results, setResults] = useState<PlaceResult[]>([]);
    const [locationName, setLocationName] = useState(place?.locationName || "");
    const [latitude, setLatitude] = useState(place?.latitude?.toString() ?? "");
    const [longitude, setLongitude] = useState(place?.longitude?.toString() ?? "");
    const [typeName, setTypeName] = useState(place?.type?.name ?? "");
    const [imageUrl, setImageUrl] = useState(place?.imageUrl || "");
    const typeListId = useId();
    const matchedType = typeName.trim() ? types.find(type => visitTypeKey(type.name) === visitTypeKey(typeName)) : undefined;
    const hiddenType = matchedType && !matchedType.isActive && matchedType.id !== place?.typeId;

    useEffect(() => {
        setResults([]); setSearchError(""); setSearching(false);
        if (query.trim().length < 3) return;
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const response = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
                if (!response.ok) throw new Error("search");
                const data = await response.json();
                setResults(data.places || []);
                if (!data.places?.length) setSearchError("Sin resultados. Puedes guardar la zona o añadir coordenadas más adelante.");
            } catch {
                if (!controller.signal.aborted) setSearchError("No se pudo buscar. Puedes guardar el lugar sin ubicarlo.");
            } finally { if (!controller.signal.aborted) setSearching(false); }
        }, 350);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [query]);

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setBusy(true); setError("");
        try {
            const result = await saveVisitPlace(place?.id ?? null, {
                title: data.get("title"), notes: data.get("notes"), sourceUrl: data.get("sourceUrl"),
                imageUrl,
                typeId: matchedType?.id ?? null,
                typeName: matchedType ? "" : typeName.trim(),
                locationName, latitude: latitude.trim() ? Number(latitude) : null,
                longitude: longitude.trim() ? Number(longitude) : null,
            });
            if (result.success) onSaved();
            else setError(result.error || "No se ha podido guardar.");
        } catch { setError("No se ha podido conectar. Inténtalo de nuevo."); }
        finally { setBusy(false); }
    }

    return <section className="visit-panel" aria-labelledby="visit-form-title">
        <h2 id="visit-form-title">{place ? "Editar lugar" : "Guardar un lugar"}</h2>
        <p className="visit-muted">Con el nombre basta. Puedes completar el resto cuando quieras.</p>
        <form onSubmit={submit}>
            <fieldset disabled={busy} className="visit-form-fields">
                <label>Nombre del lugar<input className="input" name="title" defaultValue={place?.title} maxLength={200} required autoFocus placeholder="Ese sitio al que queremos ir" /></label>
                <label>Enlace original <span className="visit-muted">(opcional)</span><input className="input" name="sourceUrl" type="url" defaultValue={place?.sourceUrl || ""} maxLength={2000} placeholder="https://…" /><small className="visit-muted">Instagram, TikTok, Wikiloc, una web…</small></label>
                <label>URL de la foto <span className="visit-muted">(opcional)</span><input className="input" name="imageUrl" type="url" value={imageUrl} onChange={event => setImageUrl(event.target.value)} maxLength={2000} placeholder="https://…/foto.jpg" /><small className="visit-muted">Pega el enlace directo a una imagen para mostrarla en la ficha. Déjalo vacío para quitar la foto.</small></label>
                {/^https?:\/\//i.test(imageUrl.trim()) && <VisitPlaceImage imageUrl={imageUrl.trim()} title={place?.title || "este lugar"} className="visit-place-image--preview" />}
                <label>Tipo de lugar
                    <input className="input" name="typeName" list={typeListId} value={typeName} onChange={event => setTypeName(event.target.value)} maxLength={80} autoComplete="off" placeholder="Elige un tipo o escribe uno nuevo" aria-describedby={`${typeListId}-help`} />
                    <datalist id={typeListId}>
                        {types.filter(type => type.isActive || type.id === place?.typeId).map(type => <option key={type.id} value={type.name} />)}
                    </datalist>
                    <small id={`${typeListId}-help`} className={hiddenType ? "visit-error" : "visit-muted"} aria-live="polite">
                        {hiddenType ? "Este tipo está oculto. Elige otro o actívalo desde Configuración."
                            : matchedType ? `Tipo seleccionado: ${matchedType.name}${!matchedType.isActive ? " (oculto)" : ""}.`
                            : typeName.trim() ? `Se creará «${typeName.trim().replace(/\s+/g, " ")}» al guardar el lugar.`
                            : "Selecciona uno de la lista o escribe uno nuevo. Déjalo vacío para guardar sin clasificar."}
                    </small>
                </label>
                <label>Notas <span className="visit-muted">(opcional)</span><textarea className="input" name="notes" defaultValue={place?.notes || ""} maxLength={2000} rows={3} placeholder="Qué nos llamó la atención, cuándo ir, qué llevar…" /></label>
                <details open={!!(place?.locationName || place?.latitude !== null && place?.latitude !== undefined)}>
                    <summary>Ubicación (opcional)</summary>
                    <div className="visit-form-fields" style={{ paddingTop: 16 }}>
                        <label>Buscar un lugar<input className="input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Nombre del sitio, pueblo o dirección" /></label>
                        {searching && <p role="status" className="visit-muted">Buscando…</p>}
                        {searchError && <p role="status" className="visit-muted">{searchError}</p>}
                        {results.length > 0 && <div className="visit-search-results">{results.map((result, index) => <button key={index} type="button" onClick={() => {
                            setLocationName(result.displayName); setLatitude(String(result.lat)); setLongitude(String(result.lng)); setQuery("");
                        }}>{result.displayName}</button>)}</div>}
                        <label>Zona o localidad<input className="input" value={locationName} onChange={e => setLocationName(e.target.value)} maxLength={300} placeholder="Por ejemplo, Sierra de Gredos" /></label>
                        <p className="visit-muted">Selecciona un resultado para colocarlo en el mapa o introduce sus coordenadas. La zona por sí sola sirve como referencia.</p>
                        <div className="visit-coordinate-fields">
                            <label>Latitud<input className="input" type="number" step="any" min={-90} max={90} value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="40.4168" /></label>
                            <label>Longitud<input className="input" type="number" step="any" min={-180} max={180} value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="-3.7038" /></label>
                        </div>
                        {(latitude || longitude) && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setLatitude(""); setLongitude(""); }}>Quitar coordenadas</button>}
                    </div>
                </details>
                {error && <p role="alert" className="visit-error">{error}</p>}
                <div className="visit-actions">
                    <button className="btn btn-primary btn-md" disabled={!!hiddenType}>{busy ? "Guardando…" : "Guardar lugar"}</button>
                    <button type="button" className="btn btn-ghost btn-md" onClick={onCancel}>Cancelar</button>
                </div>
            </fieldset>
        </form>
    </section>;
}
