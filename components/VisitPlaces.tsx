"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import VisitPlaceForm from "@/components/VisitPlaceForm";
import VisitPlaceImport from "@/components/VisitPlaceImport";
import VisitPlaceImage from "@/components/VisitPlaceImage";
import { deleteVisitPlace, setVisitPlaceVisited } from "@/lib/visit-actions";
import { visitTypeKey, type VisitPlaceItem, type VisitTypeOption } from "@/lib/visits";

export default function VisitPlaces({ places, types, userId, isAdmin, initialStatus = "pending" }: {
    places: VisitPlaceItem[]; types: VisitTypeOption[]; userId: number; isAdmin: boolean;
    initialStatus?: string;
}) {
    const router = useRouter();
    const [form, setForm] = useState<VisitPlaceItem | "new" | "import" | null>(null);
    const [status, setStatus] = useState(initialStatus);
    const [typeId, setTypeId] = useState("");
    const [query, setQuery] = useState("");
    const [busyId, setBusyId] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const pending = places.filter(place => !place.visited).length;
    const pendingOnMap = places.filter(place => !place.visited && place.latitude !== null && place.longitude !== null).length;
    const unlocated = pending - pendingOnMap;
    const filtered = places.filter(place =>
        (status === "all" || (status === "visited" ? place.visited : !place.visited)) &&
        (status !== "unlocated" || place.latitude === null || place.longitude === null) &&
        (!typeId || (typeId === "none" ? place.typeId === null : place.typeId === Number(typeId))) &&
        visitTypeKey(`${place.title} ${place.notes || ""} ${place.locationName || ""} ${place.type?.name || ""}`).includes(visitTypeKey(query))
    );

    async function removePlace(place: VisitPlaceItem) {
        if (busyId !== null || !window.confirm(`¿Eliminar «${place.title}»? Esta acción no se puede deshacer.`)) return;
        setBusyId(place.id); setError(""); setMessage("");
        try {
            const result = await deleteVisitPlace(place.id);
            if (result.success) {
                if (typeof form === "object" && form?.id === place.id) setForm(null);
                setMessage("Lugar eliminado."); router.refresh();
            } else setError(result.error || "No se pudo eliminar el lugar.");
        } catch { setError("No se ha podido conectar. Inténtalo de nuevo."); }
        finally { setBusyId(null); }
    }

    async function changeStatus(place: VisitPlaceItem) {
        if (busyId !== null) return;
        setBusyId(place.id); setError(""); setMessage("");
        try {
            const result = await setVisitPlaceVisited(place.id, !place.visited);
            if (result.success) { setMessage(place.visited ? "Lugar devuelto a pendientes." : "Lugar marcado como visitado."); router.refresh(); }
            else setError(result.error || "No se pudo cambiar el estado.");
        } catch { setError("No se ha podido conectar. Inténtalo de nuevo."); }
        finally { setBusyId(null); }
    }

    return <div className="visit-page">
        <header className="visit-header">
            <Link href="/" className="iconbtn iconbtn-ghost" aria-label="Volver al inicio" title="Volver al inicio"><Icon name="back" size={20} /></Link>
            <h1>Por visitar</h1>
            <Link href="/pois?visits=true" className="iconbtn iconbtn-ghost" aria-label="Ver en mapa" title="Ver en mapa"><Icon name="map" size={18} /></Link>
        </header>
        <div className="visit-content">
            <section className="visit-summary" aria-label="Resumen de lugares guardados">
                <div className="visit-summary-icon"><Icon name="pin" size={20} /></div>
                <div>
                    <p className="visit-summary-value">{places.length} {places.length === 1 ? "lugar" : "lugares"}</p>
                    <p className="visit-summary-caption">{places.length ? "en vuestra lista compartida" : "Guardad ideas para vuestra próxima escapada"}</p>
                </div>
                <button className={`visit-unlocated${status === "unlocated" ? " is-active" : ""}`} aria-pressed={status === "unlocated"} onClick={() => {
                    setStatus(status === "unlocated" ? "pending" : "unlocated"); setTypeId(""); setQuery("");
                }}><strong>{unlocated}</strong><span>Pendientes de ubicar</span></button>
            </section>
            {form === null && <div className="visit-add-actions">
                <button className="btn btn-success btn-md" onClick={() => { setForm("new"); setMessage(""); }}><Icon name="plus" size={18} />Nuevo lugar</button>
                <button className="btn btn-soft btn-md" onClick={() => { setForm("import"); setMessage(""); }}>Importar JSON</button>
            </div>}
        {form === "import" && <VisitPlaceImport types={types} onCancel={() => setForm(null)} onSaved={count => { setForm(null); setStatus("all"); setQuery(""); setTypeId(""); setMessage(`${count} ${count === 1 ? "sitio importado" : "sitios importados"}.`); router.refresh(); }} />}
        {form !== null && form !== "import" && <VisitPlaceForm key={form === "new" ? "new" : form.id} place={form === "new" ? null : form} types={types} onCancel={() => setForm(null)} onSaved={() => { setForm(null); setMessage("Lugar guardado."); router.refresh(); }} />}
        <section className="visit-collection" aria-labelledby="visit-collection-title">
        <h2 id="visit-collection-title" className="visit-section-title">Vuestros lugares</h2>
        <div className="visit-filters">
            <label className="visit-search">Buscar<input className="input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Lugar, zona o nota…" /></label>
            <label>Estado<select className="input" value={status} onChange={e => setStatus(e.target.value)}><option value="pending">Pendientes ({pending})</option><option value="unlocated">Pendientes de ubicar ({unlocated})</option><option value="visited">Visitados ({places.length - pending})</option><option value="all">Todos ({places.length})</option></select></label>
            <label>Tipo<select className="input" value={typeId} onChange={e => setTypeId(e.target.value)}><option value="">Todos los tipos</option><option value="none">Sin clasificar</option>{types.filter(type => type.isActive || places.some(place => place.typeId === type.id)).map(type => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>
        </div>
        {error && <p role="alert" className="visit-error">{error}</p>}
        <p role="status" className="visit-muted visit-feedback">{message}</p>
        {!filtered.length && <div className="visit-panel visit-empty"><Icon name="pin" size={32} /><h2>{places.length ? "No hay lugares con estos filtros" : "La próxima escapada puede empezar con un enlace"}</h2><p className="visit-muted">{places.length ? "Prueba otro tipo, estado o búsqueda." : "Guarda una ruta, un manantial o ese pueblo que acabáis de ver en redes. La ubicación puede esperar."}</p></div>}
        <div className="visit-grid">{filtered.map(place => <article id={`lugar-${place.id}`} key={place.id} className="visit-panel visit-card">
            <VisitPlaceImage imageUrl={place.imageUrl} title={place.title} />
            <div className="visit-actions"><span className="visit-tag">{place.type?.name || "Sin clasificar"}</span>{place.visited && <span className="visit-tag">✓ Visitado</span>}</div>
            <h2>{place.title}</h2>
            <p className="visit-muted">{place.locationName ? `${place.locationName}${place.latitude === null ? " · Pendiente de ubicar" : ""}` : place.latitude === null ? "Pendiente de ubicar" : "Ubicación guardada en el mapa"}</p>
            {place.notes && <p className="visit-notes">{place.notes}</p>}
            <div className="visit-actions">
                {place.sourceUrl && <a className="btn btn-soft btn-sm" href={place.sourceUrl} target="_blank" rel="noopener noreferrer">Ver enlace original ↗</a>}
                {place.latitude !== null && place.longitude !== null && <Link className="btn btn-ghost btn-sm" href={`/pois?visit=${place.id}`}>Ver en mapa</Link>}
            </div>
            {(isAdmin || place.authorId === userId) && <div className="visit-card-footer">
                <button className="btn btn-soft btn-sm" disabled={busyId !== null} onClick={() => void changeStatus(place)}>{busyId === place.id ? "Guardando…" : place.visited ? "Volver a pendientes" : "Marcar visitado"}</button>
                <div className="visit-edit-actions">
                <button className="btn btn-ghost btn-sm" disabled={busyId !== null} onClick={() => { setForm(place); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Editar</button>
                <button className="btn btn-danger btn-sm" disabled={busyId !== null} onClick={() => void removePlace(place)}>Eliminar</button>
                </div>
            </div>}
        </article>)}</div>
        </section>
        </div>
    </div>;
}
