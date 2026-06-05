"use client";

import { useState, useMemo } from "react";
import { Icon } from "@/components/Icon";
import { LucideIcon, ALL_LUCIDE_NAMES } from "@/components/LucideIcon";
import { createList, updateList, toggleListVisibility, deleteList } from "@/lib/actions";

// Convierte nombre legacy (lowercase) → PascalCase Lucide si existe
function toLucideName(raw: string): string {
    if (!raw) return "List";
    if (/^[A-Z]/.test(raw)) return raw; // ya es PascalCase
    const pascal = raw.charAt(0).toUpperCase() + raw.slice(1);
    return ALL_LUCIDE_NAMES.includes(pascal) ? pascal : "List";
}

// ── Picker de iconos ───────────────────────────────────────────────────────
function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const results = q
            ? ALL_LUCIDE_NAMES.filter(n => n.toLowerCase().includes(q))
            : ALL_LUCIDE_NAMES;
        return results.slice(0, 72); // máx 72 para no pintar miles
    }, [query]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Buscador */}
            <div style={{ position: "relative" }}>
                <Icon
                    name="search"
                    size={15}
                    style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--faint)", pointerEvents: "none" }}
                />
                <input
                    type="text"
                    placeholder="Buscar en Lucide Icons..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="input"
                    style={{ paddingLeft: 34, paddingTop: 10, paddingBottom: 10, fontSize: 14 }}
                    autoFocus
                />
            </div>

            {/* Grid de iconos */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: 4,
                background: "var(--surface-2)",
                borderRadius: 14,
                padding: 10,
                maxHeight: 240,
                overflowY: "auto",
            }}>
                {filtered.map(name => {
                    const active = value === name;
                    return (
                        <button
                            key={name}
                            type="button"
                            title={name}
                            onClick={() => onChange(name)}
                            style={{
                                width: "100%", aspectRatio: "1", display: "flex",
                                alignItems: "center", justifyContent: "center",
                                borderRadius: 10, border: "none", cursor: "pointer",
                                background: active ? "var(--primary)" : "var(--surface)",
                                color: active ? "var(--on-primary)" : "var(--text-2)",
                                transition: "background .12s, color .12s",
                            }}
                        >
                            <LucideIcon name={name} size={17} />
                        </button>
                    );
                })}
                {filtered.length === 0 && (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "16px 0", color: "var(--faint)", fontSize: 13 }}>
                        Sin resultados para "{query}"
                    </div>
                )}
            </div>

            {/* Nombre del icono seleccionado */}
            {value && (
                <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, textAlign: "center" }}>
                    Seleccionado: <span style={{ fontWeight: 700, color: "var(--text)" }}>{value}</span>
                </p>
            )}
        </div>
    );
}

// ── Formulario nuevo/editar lista ─────────────────────────────────────────
interface ListFormProps {
    initial?: { name: string; icon: string };
    label: string;
    submitLabel: string;
    onSubmit: (name: string, icon: string) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
}

function ListForm({ initial, label, submitLabel, onSubmit, onCancel, isSubmitting }: ListFormProps) {
    const [name, setName] = useState(initial?.name ?? "");
    const [icon, setIcon] = useState<string>(initial?.icon ? toLucideName(initial.icon) : "List");

    return (
        <div style={{
            background: "var(--surface-alt)",
            borderRadius: 16,
            padding: 16,
            border: "1px solid var(--border)",
            display: "flex", flexDirection: "column", gap: 14,
        }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: "var(--primary)", margin: 0 }}>
                {label}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label className="label">Nombre de la lista</label>
                <input
                    className="input"
                    type="text"
                    placeholder="Nombre de la lista..."
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label className="label">Icono</label>
                <IconPicker value={icon} onChange={setIcon} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
                <button type="button" onClick={onCancel} className="btn btn-ghost btn-sm">
                    Cancelar
                </button>
                <button
                    type="button"
                    disabled={isSubmitting || !name.trim()}
                    onClick={() => onSubmit(name.trim(), icon)}
                    className="btn btn-primary btn-sm"
                >
                    {isSubmitting ? "Guardando..." : submitLabel}
                </button>
            </div>
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────
export default function ListSettings({ lists }: { lists: any[] }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newMode, setNewMode] = useState(false);

    const notifySidebar = () => window.dispatchEvent(new Event("lists-updated"));

    const handleCreate = async (name: string, icon: string) => {
        setIsSubmitting(true);
        const res = await createList({ name, type: name, icon, isVisible: true });
        if (res.success) { setNewMode(false); notifySidebar(); }
        else alert(res.error);
        setIsSubmitting(false);
    };

    const handleUpdate = async (id: number, name: string, icon: string) => {
        setIsSubmitting(true);
        const res = await updateList(id, { name, icon });
        if (res.success) { setEditingId(null); notifySidebar(); }
        else alert(res.error);
        setIsSubmitting(false);
    };

    const handleToggle = async (id: number, current: boolean) => {
        await toggleListVisibility(id, !current);
        notifySidebar();
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Seguro que quieres eliminar esta lista? Se eliminarán todos sus elementos.")) return;
        await deleteList(id);
    };

    return (
        <section style={{ background: "var(--surface)", borderRadius: 20, padding: "20px 20px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="list" size={18} style={{ color: "#4338CA" }} />
                    <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)", margin: 0 }}>
                        Listas configurables
                    </h2>
                </div>
                {!newMode && editingId === null && (
                    <button onClick={() => setNewMode(true)} className="btn btn-soft btn-sm" style={{ gap: 4 }}>
                        <Icon name="plus" size={14} />
                        Añadir
                    </button>
                )}
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: newMode || editingId !== null ? 16 : 14 }}>
                Muestra, edita u oculta tus listas.
            </p>

            {newMode && (
                <div style={{ marginBottom: 14 }}>
                    <ListForm
                        label="NUEVA LISTA"
                        submitLabel="+ Crear lista"
                        onSubmit={handleCreate}
                        onCancel={() => setNewMode(false)}
                        isSubmitting={isSubmitting}
                    />
                </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lists.length === 0 && !newMode && (
                    <p style={{ textAlign: "center", color: "var(--faint)", fontSize: 13, padding: "20px 0" }}>
                        No hay listas configuradas.
                    </p>
                )}

                {lists.map(list => {
                    const lucideName = toLucideName(list.icon);
                    const isEditing = editingId === list.id;

                    if (isEditing) {
                        return (
                            <ListForm
                                key={list.id}
                                label="EDITAR LISTA"
                                submitLabel="Guardar"
                                initial={{ name: list.name, icon: list.icon }}
                                onSubmit={(name, icon) => handleUpdate(list.id, name, icon)}
                                onCancel={() => setEditingId(null)}
                                isSubmitting={isSubmitting}
                            />
                        );
                    }

                    return (
                        <div
                            key={list.id}
                            style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "12px 14px", borderRadius: 14,
                                background: "var(--surface-2)", opacity: list.isVisible ? 1 : 0.5,
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <Icon name="grip" size={16} style={{ color: "var(--faint)", flexShrink: 0 }} />
                                <div style={{
                                    width: 34, height: 34, borderRadius: 10, display: "flex",
                                    alignItems: "center", justifyContent: "center",
                                    background: "var(--primary-soft)", color: "var(--primary-soft-text)", flexShrink: 0,
                                }}>
                                    <LucideIcon name={lucideName} size={16} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{list.name}</div>
                                    <div style={{ fontSize: 11, color: "var(--faint)", fontFamily: "var(--mono)", marginTop: 1 }}>{list.type}</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <button
                                    className="iconbtn iconbtn-ghost"
                                    style={{ width: 34, height: 34 }}
                                    title={list.isVisible ? "Ocultar" : "Mostrar"}
                                    onClick={() => handleToggle(list.id, list.isVisible)}
                                >
                                    <Icon
                                        name={list.isVisible ? "eye" : "eyeOff"}
                                        size={16}
                                        style={{ color: list.isVisible ? "var(--primary)" : "var(--faint)" }}
                                    />
                                </button>
                                <button
                                    className="iconbtn iconbtn-ghost"
                                    style={{ width: 34, height: 34 }}
                                    title="Editar"
                                    onClick={() => setEditingId(list.id)}
                                >
                                    <Icon name="edit" size={16} style={{ color: "var(--muted)" }} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
