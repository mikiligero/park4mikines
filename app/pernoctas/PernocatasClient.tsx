"use client";

import { useState, useTransition } from "react";
import { deletePernocta } from "@/lib/actions";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Icon } from "@/components/Icon";

const AddPernoctaModal = dynamic(() => import("@/components/AddPernoctaModal"), { ssr: false });

interface Spot { id: number; title: string }

interface Pernocta {
    id: number;
    date: string;
    latitude: number;
    longitude: number;
    notes: string | null;
    weather: string | null;
    cost: number | null;
    locationName: string | null;
    province: string | null;
    country: string | null;
    spotId: number | null;
    spot: { title: string } | null;
}

function formatShortDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-ES", {
        day: "2-digit", month: "short", year: "numeric",
    });
}

function formatEuro(value: number) {
    return `${value.toLocaleString("es-ES", { maximumFractionDigits: 2 })}€`;
}

function StatCard({ label, value, icon, color }: {
    label: string; value: string | number;
    icon: Parameters<typeof Icon>[0]["name"]; color: string;
}) {
    return (
        <div style={{
            background: "var(--surface)", borderRadius: 18,
            border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
            padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10,
        }}>
            <div style={{
                width: 40, height: 40, borderRadius: 12, background: color,
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <Icon name={icon} size={20} style={{ color: "#fff" }} />
            </div>
            <div>
                <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)", margin: 0, lineHeight: 1.1 }}>
                    {value}
                </p>
                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "4px 0 0" }}>
                    {label}
                </p>
            </div>
        </div>
    );
}

export default function PernocatasClient({ pernoctas, spots, camperPurchasePrice }: { pernoctas: Pernocta[]; spots: Spot[]; camperPurchasePrice: number }) {
    const [showAdd, setShowAdd] = useState(false);
    const [editTarget, setEditTarget] = useState<Pernocta | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleDelete = (id: number) => {
        if (!confirm("¿Eliminar esta pernocta?")) return;
        startTransition(async () => { await deletePernocta(id); });
    };

    // ── Stats ──────────────────────────────────────────────────────────────
    const total       = pernoctas.length;
    const currentYear = new Date().getFullYear();
    const thisYear    = pernoctas.filter(p => new Date(p.date).getFullYear() === currentYear).length;
    const totalCost   = pernoctas.reduce((s, p) => s + (p.cost ?? 0), 0);
    const avgCost     = total > 0 ? Math.round(totalCost / total) : 0;
    const camperCostPerNight = total > 0 ? camperPurchasePrice / total : 0;
    const freeNights  = pernoctas.filter(p => !p.cost || p.cost === 0).length;
    const freePercent = total > 0 ? Math.round((freeNights / total) * 100) : 0;

    const uniqueProvinces = new Set(pernoctas.filter(p => p.province).map(p => p.province)).size;
    const uniqueCountries = new Set(pernoctas.filter(p => p.country).map(p => p.country)).size;

    // Por provincia
    const byProvince = pernoctas.reduce<Record<string, number>>((acc, p) => {
        if (p.province) acc[p.province] = (acc[p.province] ?? 0) + 1;
        return acc;
    }, {});
    const sortedProvinces = Object.entries(byProvince).sort((a, b) => b[1] - a[1]);
    const maxProv = sortedProvinces[0]?.[1] ?? 1;

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: 80 }}>

            {/* Header */}
            <div style={{
                position: "sticky", top: 0, zIndex: 50,
                background: "var(--surface)", borderBottom: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 16px", height: 52,
            }}>
                <Link href="/" style={{ textDecoration: "none" }}>
                    <button className="iconbtn iconbtn-ghost" style={{ width: 36, height: 36 }}>
                        <Icon name="back" size={20} />
                    </button>
                </Link>
                <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em", color: "var(--text)" }}>
                    Pernoctas
                </span>
                <Link href="/pois?pernoctas=true" style={{ textDecoration: "none" }}>
                    <button className="iconbtn iconbtn-ghost" style={{ width: 36, height: 36 }} title="Ver en mapa">
                        <Icon name="map" size={18} />
                    </button>
                </Link>
            </div>

            <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px 0" }}>

                {/* Hero summary */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: "var(--surface)", borderRadius: 18,
                    border: "1px solid var(--border)", padding: "16px 20px",
                    marginBottom: 14, boxShadow: "var(--shadow-sm)",
                }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                        background: "var(--primary-soft)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <Icon name="moon" size={24} style={{ color: "var(--primary-soft-text)" }} />
                    </div>
                    <div>
                        <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)", margin: 0, lineHeight: 1 }}>
                            {total} {total === 1 ? "noche" : "noches"}
                        </p>
                        <p style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, margin: "4px 0 0" }}>
                            {total === 0
                                ? "Aún no hay pernoctas registradas"
                                : `en ${total} pernocta${total !== 1 ? "s" : ""} registrada${total !== 1 ? "s" : ""}`}
                        </p>
                    </div>
                </div>

                {/* Stats 3×2 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                    <StatCard label="Camper / noche" value={formatEuro(camperCostPerNight)} icon="camper"   color="var(--primary)" />
                    <StatCard label={`En ${currentYear}`} value={thisYear}               icon="calendar" color="#4F46E5" />
                    <StatCard label="Coste total"   value={formatEuro(totalCost)}        icon="euro"     color="var(--primary)" />
                    <StatCard label="Media / noche" value={`${avgCost}€`}                icon="chart"    color="var(--warning)" />
                    <StatCard label="Provincias"    value={uniqueProvinces}               icon="pin"      color="var(--danger)" />
                    <StatCard label="Países"        value={uniqueCountries}               icon="globe"    color="var(--water)" />
                </div>

                {/* Botón añadir */}
                <button onClick={() => setShowAdd(true)} className="btn btn-success btn-lg btn-full" style={{ marginBottom: 20 }}>
                    <Icon name="plus" size={18} />
                    Nueva pernocta
                </button>

                {total === 0 ? (
                    <div style={{
                        textAlign: "center", padding: "48px 16px",
                        border: "2px dashed var(--border)", borderRadius: 20, color: "var(--muted)",
                    }}>
                        <Icon name="moon" size={36} style={{ color: "var(--border-strong)", marginBottom: 12 }} />
                        <p style={{ fontWeight: 700, fontSize: 15, margin: "0 0 4px" }}>Sin pernoctas todavía</p>
                        <p style={{ fontSize: 13, margin: 0 }}>Pulsa el botón para registrar la primera.</p>
                    </div>
                ) : (
                    <>
                        {/* Noches gratis */}
                        <div style={{
                            background: "var(--surface)", borderRadius: 18,
                            border: "1px solid var(--border)", padding: "16px 20px",
                            marginBottom: 20, boxShadow: "var(--shadow-sm)",
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>Noches gratis</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>
                                    {freeNights}/{total} · {freePercent}%
                                </span>
                            </div>
                            <div style={{ height: 8, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden" }}>
                                <div style={{
                                    height: "100%", borderRadius: 99,
                                    background: "var(--primary)",
                                    width: `${freePercent}%`,
                                    transition: "width .4s ease",
                                }} />
                            </div>
                        </div>

                        {/* Por provincia */}
                        {sortedProvinces.length > 0 && (
                            <div style={{ marginBottom: 20 }}>
                                <p style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)", margin: "0 0 12px 2px" }}>
                                    Por provincia
                                </p>
                                <div style={{
                                    background: "var(--surface)", borderRadius: 18,
                                    border: "1px solid var(--border)", padding: "4px 20px",
                                    boxShadow: "var(--shadow-sm)",
                                }}>
                                    {sortedProvinces.map(([prov, count], i) => (
                                        <div key={prov} style={{
                                            padding: "12px 0",
                                            borderBottom: i < sortedProvinces.length - 1 ? "1px solid var(--border)" : "none",
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{prov}</span>
                                                <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>
                                                    {count} noche{count !== 1 ? "s" : ""}
                                                </span>
                                            </div>
                                            <div style={{ height: 6, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden" }}>
                                                <div style={{
                                                    height: "100%", borderRadius: 99,
                                                    background: "var(--primary)",
                                                    width: `${Math.round((count / maxProv) * 100)}%`,
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Historial */}
                        <div>
                            <p style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)", margin: "0 0 12px 2px" }}>
                                Historial
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {pernoctas.map(p => {
                                    const title = p.locationName || p.spot?.title || `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`;
                                    const subtitle = [
                                        formatShortDate(p.date),
                                        "1 noche",
                                        p.province,
                                    ].filter(Boolean).join(" · ");

                                    return (
                                        <div key={p.id} style={{
                                            background: "var(--surface)", borderRadius: 16,
                                            border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
                                            padding: "14px 16px",
                                            display: "flex", alignItems: "flex-start", gap: 14,
                                        }}>
                                            {/* Icono */}
                                            <div style={{
                                                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                                background: "var(--primary-soft)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                            }}>
                                                <Icon name="moon" size={20} style={{ color: "var(--primary-soft-text)" }} />
                                            </div>

                                            {/* Contenido */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontWeight: 700, fontSize: 15, color: "var(--text)", margin: "0 0 3px", letterSpacing: "-0.01em" }}>
                                                    {title}
                                                </p>
                                                <p style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, margin: "0 0 5px" }}>
                                                    {subtitle}
                                                </p>
                                                {p.notes && (
                                                    <p style={{ fontSize: 13, color: "var(--text-2)", fontStyle: "italic", margin: 0 }}>
                                                        "{p.notes}"
                                                    </p>
                                                )}
                                            </div>

                                            {/* Precio + acciones */}
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                                                <span style={{
                                                    fontSize: 14, fontWeight: 700,
                                                    color: (!p.cost || p.cost === 0) ? "var(--success)" : "var(--text)",
                                                }}>
                                                    {(!p.cost || p.cost === 0) ? "Gratis" : `${p.cost}€`}
                                                </span>
                                                <div style={{ display: "flex", gap: 2 }}>
                                                    <button
                                                        onClick={() => setEditTarget(p)}
                                                        className="iconbtn iconbtn-ghost"
                                                        style={{ width: 28, height: 28 }}
                                                        title="Editar"
                                                    >
                                                        <Icon name="edit" size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(p.id)}
                                                        disabled={isPending}
                                                        className="iconbtn iconbtn-ghost"
                                                        style={{ width: 28, height: 28, color: "var(--danger)" }}
                                                        title="Eliminar"
                                                    >
                                                        <Icon name="trash" size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modales */}
            {showAdd && <AddPernoctaModal spots={spots} onClose={() => setShowAdd(false)} />}
            {editTarget && (
                <AddPernoctaModal
                    spots={spots}
                    editData={{
                        id: editTarget.id,
                        date: editTarget.date,
                        latitude: editTarget.latitude,
                        longitude: editTarget.longitude,
                        notes: editTarget.notes,
                        weather: editTarget.weather,
                        cost: editTarget.cost,
                        spotId: editTarget.spotId,
                    }}
                    onClose={() => setEditTarget(null)}
                />
            )}
        </div>
    );
}
