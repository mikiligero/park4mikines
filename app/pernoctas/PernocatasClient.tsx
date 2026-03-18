"use client";

import { useState, useTransition } from "react";
import { Moon, Plus, Trash2, Pencil, MapPin, Calendar, Euro, CloudSun, FileText, Globe, Map } from "lucide-react";
import { deletePernocta } from "@/lib/actions";
import dynamic from "next/dynamic";
import Link from "next/link";

const AddPernoctaModal = dynamic(() => import("@/components/AddPernoctaModal"), { ssr: false });

interface Spot { id: number; title: string; }

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

interface PernocatasClientProps {
    pernoctas: Pernocta[];
    spots: Spot[];
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex flex-col gap-1 shadow-sm">
            <div className="text-indigo-500 dark:text-indigo-400 mb-1">{icon}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white line-clamp-1">{value}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500">{label}</div>
        </div>
    );
}

export default function PernocatasClient({ pernoctas, spots }: PernocatasClientProps) {
    const [showAdd, setShowAdd] = useState(false);
    const [editTarget, setEditTarget] = useState<Pernocta | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleDelete = (id: number) => {
        if (!confirm("¿Eliminar esta pernocta?")) return;
        startTransition(async () => {
            await deletePernocta(id);
        });
    };

    // Stats
    const total = pernoctas.length;
    const currentYear = new Date().getFullYear();
    const thisYear = pernoctas.filter((p) => new Date(p.date).getFullYear() === currentYear).length;
    const totalCost = pernoctas.reduce((sum, p) => sum + (p.cost ?? 0), 0);
    
    const uniqueProvinces = new Set(pernoctas.filter((p) => p.province).map((p) => p.province)).size;
    const uniqueCountries = new Set(pernoctas.filter((p) => p.country).map((p) => p.country)).size;

    // Group by year for display
    const byYear = pernoctas.reduce<Record<number, Pernocta[]>>((acc, p) => {
        const y = new Date(p.date).getFullYear();
        if (!acc[y]) acc[y] = [];
        acc[y].push(p);
        return acc;
    }, {});

    const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            {/* Title */}
            <div className="flex items-center justify-between px-1">
                <div className="w-10"></div> {/* Spacer to center title */}
                <div className="text-center">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        Pernoctas 🌙
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} {total === 1 ? "noche registrada" : "noches registradas"}</p>
                </div>
                <Link 
                    href="/?pernoctas=true"
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm hover:shadow-md transition-all active:scale-95"
                    title="Ver en el mapa"
                >
                    <Map className="h-5 w-5" />
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                <StatCard label="Noches" value={total} icon={<Moon className="h-5 w-5" />} />
                <StatCard label={`En ${currentYear}`} value={thisYear} icon={<Calendar className="h-5 w-5" />} />
                <StatCard label="Coste" value={`${totalCost.toFixed(0)}€`} icon={<Euro className="h-5 w-5" />} />
                <StatCard label="Países" value={uniqueCountries} icon={<Globe className="h-5 w-5" />} />
                <StatCard label="Provincias" value={uniqueProvinces} icon={<MapPin className="h-5 w-5" />} />
            </div>

            {/* Add button */}
            <button
                onClick={() => setShowAdd(true)}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-200 dark:shadow-indigo-900/30"
            >
                <Plus className="h-5 w-5" />
                Nueva pernocta
            </button>

            {/* List by year */}
            {total === 0 ? (
                <div className="text-center py-16 text-gray-400 dark:text-gray-600 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                    <Moon className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>Aún no has registrado ninguna pernocta.</p>
                    <p className="text-sm mt-1">¡Pulsa el botón para añadir la primera!</p>
                </div>
            ) : (
                years.map((year) => (
                    <div key={year}>
                        <h2 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">
                            {year} — {byYear[year].length} noche{byYear[year].length !== 1 ? "s" : ""}
                        </h2>
                        <div className="space-y-2">
                            {byYear[year].map((p) => (
                                <div key={p.id} className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-gray-900 dark:text-white">{formatDate(p.date)}</span>
                                                {p.spot && (
                                                    <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                                                        {p.spot.title}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 hover:text-indigo-500 transition-colors"
                                                    title={`${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}`}
                                                >
                                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                    {p.locationName ?? `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`}
                                                </a>
                                                {p.weather && (
                                                    <span className="flex items-center gap-1">
                                                        <CloudSun className="h-3.5 w-3.5 shrink-0" />
                                                        {p.weather}
                                                    </span>
                                                )}
                                                {p.cost != null && p.cost > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Euro className="h-3.5 w-3.5 shrink-0" />
                                                        {p.cost} €
                                                    </span>
                                                )}
                                            </div>
                                            {p.notes && (
                                                <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 flex items-start gap-1">
                                                    <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                    {p.notes}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button
                                                onClick={() => setEditTarget(p)}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p.id)}
                                                disabled={isPending}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}

            {/* Modals */}
            {showAdd && (
                <AddPernoctaModal spots={spots} onClose={() => setShowAdd(false)} />
            )}
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
