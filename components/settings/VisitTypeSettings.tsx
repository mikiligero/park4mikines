"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteVisitType, saveVisitType, setVisitTypeActive } from "@/lib/visit-actions";
import type { VisitTypeOption } from "@/lib/visits";

export default function VisitTypeSettings({ types }: { types: VisitTypeOption[] }) {
    const router = useRouter();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [name, setName] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    async function run(action: () => Promise<{ success: boolean; error?: string }>, reset = false, successMessage = "Cambios guardados.") {
        setBusy(true); setError(""); setMessage("");
        try {
            const result = await action();
            if (!result.success) setError(result.error || "No se ha podido guardar.");
            else {
                if (reset) { setName(""); setEditingId(null); }
                setDeletingId(null);
                setMessage(successMessage); router.refresh();
            }
        } catch { setError("No se ha podido conectar. Inténtalo de nuevo."); }
        finally { setBusy(false); }
    }

    return (
        <section className="visit-panel">
            <h2>Tipos de lugar de Por visitar</h2>
            <p className="visit-muted">Crea los tipos que os resulten útiles. Al ocultar uno, los lugares conservan su clasificación. Si lo eliminas, pasan a «Sin clasificar».</p>
            <form onSubmit={e => { e.preventDefault(); void run(() => saveVisitType(editingId, { name }), true); }} className="visit-type-form">
                <label htmlFor="visit-type-name">{editingId === null ? "Nuevo tipo de lugar" : "Editar tipo de lugar"}</label>
                <input id="visit-type-name" className="input" required maxLength={80} value={name} onChange={e => setName(e.target.value)} placeholder="Por ejemplo, jardines botánicos" disabled={busy} />
                <div className="visit-actions">
                    <button className="btn btn-primary btn-sm" disabled={busy || !name.trim()}>{busy ? "Guardando…" : editingId === null ? "Crear tipo" : "Guardar cambios"}</button>
                    {editingId !== null && <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => { setEditingId(null); setName(""); }}>Cancelar</button>}
                </div>
            </form>
            {error && <p role="alert" className="visit-error">{error}</p>}
            <p role="status" className="visit-muted">{message}</p>
            <div className="visit-type-list">
                {types.length === 0 && <p className="visit-muted">No hay tipos de lugar. Puedes crear uno con el formulario de arriba.</p>}
                {types.map(type => <div key={type.id} className="visit-type-row">
                    <span>{type.name}{!type.isActive && <small className="visit-muted"> · Oculto</small>}</span>
                    <div className="visit-actions">
                        <button className="btn btn-ghost btn-sm" disabled={busy} aria-label={`Editar ${type.name}`} onClick={() => { setEditingId(type.id); setName(type.name); document.getElementById("visit-type-name")?.focus(); }}>Editar</button>
                        <button className="btn btn-soft btn-sm" disabled={busy} aria-label={`${type.isActive ? "Ocultar" : "Mostrar"} ${type.name}`} onClick={() => void run(() => setVisitTypeActive(type.id, !type.isActive))}>{type.isActive ? "Ocultar" : "Mostrar"}</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} disabled={busy} aria-label={`Eliminar ${type.name}`} aria-expanded={deletingId === type.id} onClick={() => { setDeletingId(type.id); setError(""); setMessage(""); }}>Eliminar</button>
                    </div>
                    {deletingId === type.id && <div className="visit-type-delete" role="group" aria-label={`Confirmar eliminación de ${type.name}`}>
                        <p>¿Eliminar «{type.name}»?</p>
                        <p className="visit-muted">Los lugares guardados se conservarán como «Sin clasificar».</p>
                        <div className="visit-actions">
                            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setDeletingId(null)}>Cancelar</button>
                            <button className="btn btn-sm" style={{ background: "var(--danger)", color: "#fff" }} disabled={busy} onClick={() => void run(() => deleteVisitType(type.id), editingId === type.id, "Tipo eliminado. Los lugares guardados se han conservado.")}>{busy ? "Eliminando…" : "Eliminar tipo"}</button>
                        </div>
                    </div>}
                </div>)}
            </div>
        </section>
    );
}
