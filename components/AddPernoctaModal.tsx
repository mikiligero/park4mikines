"use client";

import { useState, useEffect, useTransition } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";
import { addPernocta, updatePernocta } from "@/lib/actions";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
    loading: () => (
        <div style={{
            height: "100%", width: "100%", background: "var(--surface-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, color: "var(--muted)",
        }}>
            Cargando mapa...
        </div>
    ),
    ssr: false,
});

interface Spot { id: number; title: string }

interface PernoctaData {
    id?: number;
    date: string;
    latitude: number;
    longitude: number;
    notes?: string | null;
    weather?: string | null;
    cost?: number | null;
    spotId?: number | null;
}

interface Props {
    onClose: () => void;
    spots?: Spot[];
    initialSpotId?: number | null;
    initialLat?: number;
    initialLon?: number;
    editData?: PernoctaData;
}

function todayString() {
    return new Date().toISOString().split("T")[0];
}

export default function AddPernoctaModal({ onClose, spots = [], initialSpotId, initialLat, initialLon, editData }: Props) {
    const [isPending, startTransition] = useTransition();
    const [showMap, setShowMap] = useState(false);
    const [loadingGps, setLoadingGps] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [form, setForm] = useState({
        date:      editData?.date?.split("T")[0] ?? todayString(),
        latitude:  editData?.latitude  ?? initialLat ?? 40.416775,
        longitude: editData?.longitude ?? initialLon ?? -3.70379,
        notes:     editData?.notes     ?? "",
        weather:   editData?.weather   ?? "",
        cost:      editData?.cost != null ? String(editData.cost) : "0",
        spotId:    editData?.spotId ?? initialSpotId ?? "",
    });

    useEffect(() => {
        setMounted(true);
        if (!editData && initialLat === undefined) {
            setLoadingGps(true);
            navigator.geolocation?.getCurrentPosition(
                pos => {
                    setForm(p => ({ ...p, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
                    setLoadingGps(false);
                },
                () => setLoadingGps(false),
                { timeout: 5000 }
            );
        }
    }, []);

    const handleGps = () => {
        setLoadingGps(true);
        navigator.geolocation?.getCurrentPosition(
            pos => {
                setForm(p => ({ ...p, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
                setLoadingGps(false);
            },
            () => {
                alert("No se pudo obtener la ubicación");
                setLoadingGps(false);
            },
            { timeout: 5000, enableHighAccuracy: true }
        );
    };

    const handleSubmit = () => {
        startTransition(async () => {
            const data = {
                date:      form.date,
                latitude:  form.latitude,
                longitude: form.longitude,
                notes:     form.notes    || undefined,
                weather:   form.weather  || undefined,
                cost:      parseFloat(form.cost) || 0,
                spotId:    form.spotId ? Number(form.spotId) : null,
            };
            if (editData?.id) {
                await updatePernocta(editData.id, data);
            } else {
                await addPernocta(data);
            }
            onClose();
        });
    };

    if (!mounted) return null;

    return createPortal(
        <div
            style={{
                position: "fixed", inset: 0, zIndex: 9000,
                background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
                display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                background: "var(--surface)", width: "100%", maxWidth: 520,
                borderRadius: "26px 26px 0 0",
                maxHeight: "92dvh", display: "flex", flexDirection: "column",
                boxShadow: "var(--shadow-lg)", overflow: "hidden",
            }}>
                {/* ── Header ── */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "16px 20px 14px", borderBottom: "1px solid var(--border)", flexShrink: 0,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 10,
                            background: "var(--primary-soft)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <Icon name="moon" size={17} style={{ color: "var(--primary-soft-text)" }} />
                        </div>
                        <h2 style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)", margin: 0 }}>
                            {editData ? "Editar pernocta" : "Nueva pernocta"}
                        </h2>
                    </div>
                    <button className="iconbtn iconbtn-ghost" style={{ width: 36, height: 36 }} onClick={onClose}>
                        <Icon name="close" size={18} />
                    </button>
                </div>

                {/* ── Body ── */}
                <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px", display: "flex", flexDirection: "column", gap: 18 }}>

                    {/* Fecha */}
                    <div>
                        <label className="label">Fecha de la pernocta</label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                            className="input"
                        />
                        <p className="input-hint">La noche del martes al miércoles → pon martes</p>
                    </div>

                    {/* Ubicación GPS */}
                    <div>
                        <label className="label">Ubicación GPS</label>
                        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                            <div style={{
                                flex: 1, padding: "10px 14px", borderRadius: 14,
                                background: "var(--surface-2)", border: "1.5px solid var(--border)",
                                fontSize: 13, color: "var(--muted)", fontFamily: "var(--mono)",
                            }}>
                                {loadingGps
                                    ? "Obteniendo posición..."
                                    : `${form.latitude.toFixed(5)}, ${form.longitude.toFixed(5)}`}
                            </div>
                            <button
                                onClick={handleGps}
                                disabled={loadingGps}
                                className="btn btn-primary btn-sm"
                                style={{ flexShrink: 0, width: 42, padding: 0 }}
                                title="Mi posición actual"
                            >
                                <Icon name="gps" size={17} style={{ animation: loadingGps ? "spin .8s linear infinite" : "none" }} />
                            </button>
                            <button
                                onClick={() => setShowMap(v => !v)}
                                className={`btn btn-sm ${showMap ? "btn-soft" : "btn-ghost"}`}
                                style={{ flexShrink: 0, width: 42, padding: 0 }}
                                title="Seleccionar en mapa"
                            >
                                <Icon name="pin" size={17} />
                            </button>
                        </div>

                        {showMap && (
                            <div style={{ height: 200, borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", position: "relative" }}>
                                <LocationPickerMap
                                    lat={form.latitude}
                                    lng={form.longitude}
                                    onMove={(lat: number, lng: number) => setForm(p => ({ ...p, latitude: lat, longitude: lng }))}
                                />
                                <div style={{
                                    position: "absolute", top: "50%", left: "50%",
                                    transform: "translate(-50%, -100%)",
                                    pointerEvents: "none", zIndex: 500,
                                }}>
                                    <Icon name="pin" size={30} style={{ color: "var(--primary)", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Spot vinculado */}
                    {spots.length > 0 && (
                        <div>
                            <label className="label">Sitio guardado <span style={{ fontWeight: 500, color: "var(--faint)" }}>(opcional)</span></label>
                            <select
                                value={String(form.spotId)}
                                onChange={e => setForm(p => ({ ...p, spotId: e.target.value }))}
                                className="input"
                                style={{ cursor: "pointer" }}
                            >
                                <option value="">Sin vincular</option>
                                {spots.map(s => (
                                    <option key={s.id} value={s.id}>{s.title}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Tiempo */}
                    <div>
                        <label className="label">Tiempo <span style={{ fontWeight: 500, color: "var(--faint)" }}>(opcional)</span></label>
                        <input
                            type="text"
                            value={form.weather}
                            onChange={e => setForm(p => ({ ...p, weather: e.target.value }))}
                            placeholder="Ej: soleado, lluvia, viento…"
                            className="input"
                        />
                    </div>

                    {/* Coste */}
                    <div>
                        <label className="label">Coste € <span style={{ fontWeight: 500, color: "var(--faint)" }}>(opcional)</span></label>
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={form.cost}
                            onChange={e => setForm(p => ({ ...p, cost: e.target.value }))}
                            className="input"
                        />
                    </div>

                    {/* Notas */}
                    <div>
                        <label className="label">Notas <span style={{ fontWeight: 500, color: "var(--faint)" }}>(opcional)</span></label>
                        <textarea
                            value={form.notes}
                            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                            placeholder="Observaciones, incidencias…"
                            rows={3}
                            className="input"
                            style={{ resize: "none", height: "auto" }}
                        />
                    </div>

                </div>

                {/* ── Footer ── */}
                <div style={{
                    padding: "14px 20px 28px", borderTop: "1px solid var(--border)",
                    display: "flex", gap: 10, flexShrink: 0,
                }}>
                    <button onClick={onClose} className="btn btn-ghost btn-md" style={{ flex: 1 }}>
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isPending || loadingGps}
                        className="btn btn-primary btn-md"
                        style={{ flex: 2 }}
                    >
                        {editData ? "Guardar cambios" : "Guardar pernocta"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
