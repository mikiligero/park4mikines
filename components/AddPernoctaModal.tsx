"use client";

import { useState, useEffect, useTransition } from "react";
import dynamic from "next/dynamic";
import { X, MapPin, Crosshair, Loader2, Moon } from "lucide-react";
import { createPortal } from "react-dom";
import { addPernocta, updatePernocta } from "@/lib/actions";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
    loading: () => <div className="h-full w-full bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center text-sm text-gray-400">Cargando mapa...</div>,
    ssr: false,
});

interface Spot {
    id: number;
    title: string;
}

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

interface AddPernoctaModalProps {
    onClose: () => void;
    spots?: Spot[];
    initialSpotId?: number | null;
    initialLat?: number;
    initialLon?: number;
    editData?: PernoctaData;
}

// Returns today's date as YYYY-MM-DD
function todayString() {
    const d = new Date();
    return d.toISOString().split("T")[0];
}

export default function AddPernoctaModal({ onClose, spots = [], initialSpotId, initialLat, initialLon, editData }: AddPernoctaModalProps) {
    const [isPending, startTransition] = useTransition();
    const [showMap, setShowMap] = useState(false);
    const [loadingGps, setLoadingGps] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [form, setForm] = useState({
        date: editData?.date?.split("T")[0] ?? todayString(),
        latitude: editData?.latitude ?? initialLat ?? 40.416775,
        longitude: editData?.longitude ?? initialLon ?? -3.70379,
        notes: editData?.notes ?? "",
        weather: editData?.weather ?? "",
        cost: editData?.cost != null ? String(editData.cost) : "0",
        spotId: editData?.spotId ?? initialSpotId ?? "",
    });

    useEffect(() => {
        setMounted(true);
        // Auto-get GPS on open (only for new pernoctas)
        if (!editData && initialLat === undefined) {
            setLoadingGps(true);
            navigator.geolocation?.getCurrentPosition(
                (pos) => {
                    setForm((prev) => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
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
            (pos) => {
                setForm((prev) => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
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
                date: form.date,
                latitude: form.latitude,
                longitude: form.longitude,
                notes: form.notes || undefined,
                weather: form.weather || undefined,
                cost: parseFloat(form.cost) || 0,
                spotId: form.spotId ? Number(form.spotId) : null,
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
        <div className="fixed inset-0 z-[9000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-white dark:bg-gray-950 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <Moon className="h-5 w-5 text-indigo-500" />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            {editData ? "Editar pernocta" : "Nueva pernocta"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de la pernocta</label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                        />
                        <p className="text-xs text-gray-400 mt-1">La noche del martes al miércoles → martes</p>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ubicación GPS</label>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400 font-mono">
                                {loadingGps
                                    ? "Obteniendo posición..."
                                    : `${form.latitude.toFixed(5)}, ${form.longitude.toFixed(5)}`}
                            </div>
                            <button
                                onClick={handleGps}
                                disabled={loadingGps}
                                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                title="Mi posición actual"
                            >
                                {loadingGps ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                            </button>
                            <button
                                onClick={() => setShowMap((v) => !v)}
                                className={`p-2.5 rounded-xl border transition-colors ${showMap ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-600" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                                title="Seleccionar en mapa"
                            >
                                <MapPin className="h-4 w-4" />
                            </button>
                        </div>

                        {showMap && (
                            <div className="relative h-52 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                <LocationPickerMap
                                    initialPosition={[form.latitude, form.longitude]}
                                    onPositionChange={(pos) => setForm((p) => ({ ...p, latitude: pos.lat, longitude: pos.lng }))}
                                />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-[500]">
                                    <MapPin className="h-8 w-8 text-indigo-600 drop-shadow-md" fill="currentColor" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Spot link */}
                    {spots.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sitio guardado (opcional)</label>
                            <select
                                value={form.spotId}
                                onChange={(e) => setForm((p) => ({ ...p, spotId: e.target.value }))}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm"
                            >
                                <option value="">Sin vincular</option>
                                {spots.map((s) => (
                                    <option key={s.id} value={s.id}>{s.title}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Weather */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiempo 🌤️ (opcional)</label>
                        <input
                            type="text"
                            value={form.weather}
                            onChange={(e) => setForm((p) => ({ ...p, weather: e.target.value }))}
                            placeholder="Ej: soleado, lluvia, viento..."
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm"
                        />
                    </div>

                    {/* Cost */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coste € (opcional)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={form.cost}
                            onChange={(e) => setForm((p) => ({ ...p, cost: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas 📝 (opcional)</label>
                        <textarea
                            value={form.notes}
                            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                            placeholder="Observaciones, incidencias..."
                            rows={3}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isPending || loadingGps}
                        className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        {editData ? "Guardar cambios" : "Guardar pernocta"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
