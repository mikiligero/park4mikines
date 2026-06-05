"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import {
    addChecklistItem, toggleChecklistItem, deleteChecklistItem,
    resetChecklistItems, deleteChecklistCategory, addChecklistCategory,
} from "@/lib/actions";

interface Category { id: number; name: string; type: string }
interface ChecklistItem { id: number; text: string; checked: boolean; categoryId?: number | null }
interface ChecklistProps { title: string; type: string; items: ChecklistItem[]; categories: Category[] }

// ── Inline add form per category ───────────────────────────────────────────
function InlineAddForm({ type, categoryId }: { type: string; categoryId: number | null }) {
    const [text, setText] = useState("");
    const [open, setOpen] = useState(false);
    const [busy, startTransition] = useTransition();
    const inputRef = useRef<HTMLInputElement>(null);
    // Señal para refocalizar tras el re-render del server action
    const refocusRef = useRef(false);

    // Corre después de CADA render — aplica el foco solo cuando el input ya no está disabled
    useEffect(() => {
        if (refocusRef.current && open && !busy) {
            inputRef.current?.focus();
            refocusRef.current = false;
        }
    });

    const submit = () => {
        const trimmed = text.trim();
        if (!trimmed || busy) return;
        refocusRef.current = true; // señal antes de que el re-render llegue
        startTransition(async () => {
            await addChecklistItem(trimmed, type, categoryId);
            setText("");
        });
    };

    if (!open) {
        return (
            <button
                onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 10); }}
                style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%",
                    padding: "10px 0", background: "none", border: "none", cursor: "pointer",
                    color: "var(--primary)", fontSize: 14, fontWeight: 700,
                }}
            >
                <Icon name="plus" size={16} />
                Añadir elemento
            </button>
        );
    }

    return (
        <div style={{ display: "flex", gap: 8, paddingTop: 8 }}>
            <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                    if (e.key === "Enter") { e.preventDefault(); submit(); }
                    if (e.key === "Escape") { setOpen(false); setText(""); }
                }}
                placeholder="Nombre del elemento..."
                disabled={busy}
                className="input"
                style={{ flex: 1, fontSize: 14, padding: "10px 14px" }}
            />
            <button onClick={submit} disabled={!text.trim() || busy} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                <Icon name="check" size={15} />
            </button>
            <button onClick={() => { setOpen(false); setText(""); }} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
                <Icon name="close" size={15} />
            </button>
        </div>
    );
}

// ── Add category form (edit mode only) ─────────────────────────────────────
function AddCategoryForm({ type }: { type: string }) {
    const [text, setText] = useState("");
    const [open, setOpen] = useState(false);
    const [busy, startTransition] = useTransition();
    const inputRef = useRef<HTMLInputElement>(null);

    const submit = () => {
        const trimmed = text.trim();
        if (!trimmed || busy) return;
        startTransition(async () => {
            await addChecklistCategory(trimmed, type);
            setText("");
            setOpen(false);
        });
    };

    if (!open) {
        return (
            <button
                onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 10); }}
                style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%",
                    padding: "12px 16px", borderRadius: 14, border: "2px dashed var(--border)",
                    background: "none", cursor: "pointer", color: "var(--muted)",
                    fontSize: 14, fontWeight: 600,
                }}
            >
                <Icon name="plus" size={16} />
                Nueva categoría
            </button>
        );
    }

    return (
        <div style={{ display: "flex", gap: 8 }}>
            <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                    if (e.key === "Enter") { e.preventDefault(); submit(); }
                    if (e.key === "Escape") { setOpen(false); setText(""); }
                }}
                placeholder="Nombre de la categoría..."
                disabled={busy}
                className="input"
                style={{ flex: 1, fontSize: 14, padding: "10px 14px" }}
            />
            <button onClick={submit} disabled={!text.trim() || busy} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                <Icon name="check" size={15} />
            </button>
            <button onClick={() => { setOpen(false); setText(""); }} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
                <Icon name="close" size={15} />
            </button>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Checklist({ title, type, items, categories }: ChecklistProps) {
    const [editMode, setEditMode] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const total   = items.length;
    const checked = items.filter(i => i.checked).length;
    const percent = total > 0 ? Math.round((checked / total) * 100) : 0;

    const handleReset = async () => {
        if (isResetting || checked === 0) return;
        if (!confirm("¿Desmarcar todos los elementos de la lista?")) return;
        setIsResetting(true);
        await resetChecklistItems(type);
        setIsResetting(false);
    };

    const handleDeleteCategory = (cat: Category) => {
        if (!confirm(`¿Eliminar la categoría "${cat.name}" y todas sus tareas?`)) return;
        deleteChecklistCategory(cat.id, type);
    };

    const handleDeleteItem = (item: ChecklistItem) => {
        if (!confirm(`¿Eliminar "${item.text}"?`)) return;
        deleteChecklistItem(item.id, type);
    };

    // ── Uncategorized items ──
    const uncategorized = items.filter(i => !i.categoryId);

    // ── Render categories ──
    const allSections: Array<{ id: number | null; name: string; isVirtual?: boolean }> = [
        ...categories,
        ...(uncategorized.length > 0 ? [{ id: null, name: "Sin categoría", isVirtual: true }] : []),
    ];

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 88 }}>

            {/* ── Header ── */}
            <div style={{
                position: "sticky", top: 0, zIndex: 50,
                background: "var(--surface)", borderBottom: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 16px", height: 52, flexShrink: 0,
            }}>
                <Link href="/" style={{ textDecoration: "none" }}>
                    <button className="iconbtn iconbtn-ghost" style={{ width: 36, height: 36 }}>
                        <Icon name="back" size={20} />
                    </button>
                </Link>
                <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em", color: "var(--text)" }}>
                    {title}
                </span>
                {editMode ? (
                    <button
                        onClick={() => setEditMode(false)}
                        style={{
                            padding: "6px 14px", borderRadius: 99, border: "none", cursor: "pointer",
                            background: "var(--surface-2)", color: "var(--text)", fontSize: 14, fontWeight: 700,
                        }}
                    >
                        Listo
                    </button>
                ) : (
                    <button className="iconbtn iconbtn-ghost" style={{ width: 36, height: 36 }} onClick={() => setEditMode(true)}>
                        <Icon name="edit" size={18} />
                    </button>
                )}
            </div>

            <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 16px 0" }}>

                {/* ── Progress card ── */}
                <div style={{
                    background: "var(--surface)", borderRadius: 18, border: "1px solid var(--border)",
                    padding: "16px 20px", marginBottom: 20, boxShadow: "var(--shadow-sm)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Listo para salir</span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: "var(--primary)" }}>{checked}/{total}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden", marginBottom: 12 }}>
                        <div style={{
                            height: "100%", borderRadius: 99, background: "var(--primary)",
                            width: `${percent}%`, transition: "width .4s ease",
                        }} />
                    </div>
                    <button
                        onClick={handleReset}
                        disabled={isResetting || checked === 0}
                        style={{
                            display: "flex", alignItems: "center", gap: 6, background: "none",
                            border: "none", cursor: checked === 0 ? "default" : "pointer",
                            color: checked === 0 ? "var(--faint)" : "var(--primary)",
                            fontSize: 13, fontWeight: 700, padding: 0, opacity: checked === 0 ? 0.5 : 1,
                        }}
                    >
                        <Icon name="refresh" size={14} style={{ animation: isResetting ? "spin .8s linear infinite" : "none" }} />
                        Empezar de nuevo
                    </button>
                </div>

                {/* ── Category sections ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {allSections.map(sec => {
                        const secItems = sec.id === null
                            ? uncategorized
                            : items.filter(i => i.categoryId === sec.id);

                        const sortedItems = secItems.slice().sort((a, b) => {
                            if (a.checked !== b.checked) return a.checked ? 1 : -1;
                            return 0;
                        });

                        return (
                            <div
                                key={sec.id ?? "uncategorized"}
                                style={{
                                    background: "var(--surface)", borderRadius: 18,
                                    border: "1px solid var(--border)", overflow: "hidden",
                                    boxShadow: "var(--shadow-sm)",
                                }}
                            >
                                {/* Category header */}
                                <div style={{
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    padding: editMode ? "12px 16px" : "12px 16px 4px",
                                    borderBottom: "1px solid var(--border)",
                                }}>
                                    <span style={{
                                        fontSize: 11, fontWeight: 800, letterSpacing: "0.07em",
                                        color: "var(--muted)", textTransform: "uppercase",
                                    }}>
                                        {sec.name}
                                    </span>
                                    {editMode && !sec.isVirtual && sec.id !== null && (
                                        <button
                                            onClick={() => handleDeleteCategory(sec as Category)}
                                            className="iconbtn iconbtn-ghost"
                                            style={{ width: 30, height: 30, color: "var(--danger)" }}
                                        >
                                            <Icon name="trash" size={15} />
                                        </button>
                                    )}
                                </div>

                                {/* Items */}
                                <div style={{ padding: "4px 0" }}>
                                    {sortedItems.map((item, i) => (
                                        <div
                                            key={item.id}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 12,
                                                padding: "11px 16px",
                                                borderBottom: i < sortedItems.length - 1 ? "1px solid var(--border)" : "none",
                                            }}
                                        >
                                            {editMode ? (
                                                <>
                                                    <span style={{
                                                        flex: 1, fontSize: 14, fontWeight: 600,
                                                        color: "var(--text)",
                                                    }}>
                                                        {item.text}
                                                    </span>
                                                    <button
                                                        onClick={() => handleDeleteItem(item)}
                                                        className="iconbtn iconbtn-ghost"
                                                        style={{ width: 30, height: 30, color: "var(--danger)", flexShrink: 0 }}
                                                    >
                                                        <Icon name="trash" size={15} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => toggleChecklistItem(item.id, !item.checked, type)}
                                                        className={`cbox ${item.checked ? "is-on" : ""}`}
                                                        style={{ flexShrink: 0 }}
                                                    >
                                                        {item.checked && <Icon name="check" size={13} />}
                                                    </button>
                                                    <span
                                                        onClick={() => toggleChecklistItem(item.id, !item.checked, type)}
                                                        style={{
                                                            flex: 1, fontSize: 14, fontWeight: 600,
                                                            color: item.checked ? "var(--faint)" : "var(--text)",
                                                            textDecoration: item.checked ? "line-through" : "none",
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        {item.text}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    ))}

                                    {/* Add item row */}
                                    <div style={{ padding: "0 16px 12px", borderTop: sortedItems.length > 0 ? "1px solid var(--border)" : "none" }}>
                                        <InlineAddForm type={type} categoryId={sec.id ?? null} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add category (edit mode only) */}
                    {editMode && (
                        <AddCategoryForm type={type} />
                    )}

                    {/* Empty state */}
                    {allSections.length === 0 && (
                        <div style={{
                            textAlign: "center", padding: "48px 16px",
                            border: "2px dashed var(--border)", borderRadius: 18, color: "var(--muted)",
                        }}>
                            <Icon name="list" size={32} style={{ color: "var(--border-strong)", marginBottom: 12 }} />
                            <p style={{ fontWeight: 700, fontSize: 15, margin: "0 0 4px" }}>Lista vacía</p>
                            <p style={{ fontSize: 13, margin: 0 }}>Activa el modo edición para añadir categorías.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
