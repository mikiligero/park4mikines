"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import VisitPlaceForm from "@/components/VisitPlaceForm";
import VisitPlaceImage from "@/components/VisitPlaceImage";
import { deleteVisitPlace, setVisitPlaceVisited } from "@/lib/visit-actions";
import type { VisitPlaceItem, VisitTypeOption } from "@/lib/visits";
import "./VisitPlaceDetail.css";

export default function VisitPlaceDetail({ place, types, userId, isAdmin, onClose }: {
    place: VisitPlaceItem; types: VisitTypeOption[]; userId: number | null; isAdmin: boolean; onClose: () => void;
}) {
    const router = useRouter();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [refreshing, startTransition] = useTransition();
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const located = place.latitude !== null && place.longitude !== null;
    const canEdit = isAdmin || place.authorId === userId;
    const saving = busy || refreshing;

    async function removePlace() {
        if (saving || !window.confirm(`¿Eliminar «${place.title}»? Esta acción no se puede deshacer.`)) return;
        setBusy(true); setError(""); setMessage("");
        try {
            const result = await deleteVisitPlace(place.id);
            if (result.success) { onClose(); router.refresh(); }
            else setError(result.error || "No se pudo eliminar el lugar.");
        } catch { setError("No se ha podido conectar. Inténtalo de nuevo."); }
        finally { setBusy(false); }
    }

    async function changeStatus() {
        if (saving) return;
        setBusy(true); setError(""); setMessage("");
        try {
            const result = await setVisitPlaceVisited(place.id, !place.visited);
            if (result.success) {
                setMessage(place.visited ? "Lugar devuelto a pendientes." : "Lugar marcado como visitado.");
                startTransition(() => router.refresh());
            } else setError(result.error || "No se pudo cambiar el estado.");
        } catch { setError("No se ha podido conectar. Inténtalo de nuevo."); }
        finally { setBusy(false); }
    }

    useEffect(() => {
        const dialog = dialogRef.current;
        dialog?.showModal();
        return () => { dialog?.close(); };
    }, []);

    return <dialog
        ref={dialogRef}
        className="visit-detail-dialog"
        aria-labelledby="visit-detail-title"
        onCancel={event => { event.preventDefault(); if (!saving) onClose(); }}
        onClick={event => { if (event.target === event.currentTarget && !saving) onClose(); }}
    >
        <div className="visit-detail-panel">
            <header className="visit-detail-header">
                <span>{editing ? "Editar lugar" : "Ficha del lugar"}</span>
                <button className="iconbtn iconbtn-ghost" onClick={onClose} disabled={saving} aria-label="Cerrar ficha del lugar" autoFocus><Icon name="close" size={20} /></button>
            </header>
            <div className="visit-detail-content">
                {!editing && <VisitPlaceImage imageUrl={place.imageUrl} title={place.title} className="visit-place-image--detail" />}
                <div className="visit-map-icon"><Icon name={place.visited ? "check" : "pin"} size={24} /></div>
                <div className="visit-actions">
                    <span className="visit-tag">{place.type?.name || "Sin clasificar"}</span>
                    <span className={`visit-map-status${place.visited ? " is-visited" : ""}`}>{place.visited ? "Visitado" : "Por visitar"}</span>
                </div>
                <h2 id="visit-detail-title">{place.title}</h2>
                {error && <p role="alert" className="visit-error">{error}</p>}
                <p role="status" className="visit-muted visit-feedback">{message}</p>
                {editing && canEdit ? <VisitPlaceForm key={place.id} place={place} types={types} onCancel={() => setEditing(false)} onSaved={() => {
                    setEditing(false); setMessage("Lugar guardado."); startTransition(() => router.refresh());
                }} /> : <>
                <section className="visit-detail-section" aria-labelledby="visit-detail-location">
                    <h3 id="visit-detail-location"><Icon name="pin" size={16} />Ubicación</h3>
                    <p>{place.locationName || (located ? "Ubicación guardada en el mapa" : "Pendiente de ubicar")}</p>
                    {located && <p className="visit-detail-coordinates">{place.latitude!.toFixed(6)}, {place.longitude!.toFixed(6)}</p>}
                </section>
                <section className="visit-detail-section" aria-labelledby="visit-detail-notes">
                    <h3 id="visit-detail-notes"><Icon name="edit" size={16} />Notas</h3>
                    <p className="visit-detail-notes">{place.notes || "Todavía no hay notas para este lugar."}</p>
                </section>
                {place.sourceUrl && <section className="visit-detail-section" aria-labelledby="visit-detail-source">
                    <h3 id="visit-detail-source"><Icon name="globe" size={16} />Enlace original</h3>
                    <a className="visit-detail-source" href={place.sourceUrl} target="_blank" rel="noopener noreferrer">{place.sourceUrl} <span aria-hidden="true">↗</span></a>
                </section>}
                </>}
            </div>
            {!editing && (located || canEdit) && <footer className="visit-detail-footer">
                {canEdit && <div className="visit-detail-actions">
                    <button className="btn btn-primary btn-md" disabled={saving} onClick={() => void changeStatus()}>{saving ? "Guardando…" : place.visited ? "Volver a pendientes" : "Marcar visitado"}</button>
                    <div className="visit-edit-actions">
                    <button className="btn btn-soft btn-md" disabled={saving} onClick={() => { setEditing(true); setError(""); setMessage(""); }}><Icon name="edit" size={16} />Editar lugar</button>
                    <button className="btn btn-danger btn-md" disabled={saving} onClick={() => void removePlace()}>Eliminar</button>
                    </div>
                </div>}
                {located && <a className="btn btn-soft btn-md btn-full" href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`} target="_blank" rel="noopener noreferrer"><Icon name="navigate" size={18} />Cómo llegar</a>}
            </footer>}
        </div>
    </dialog>;
}
