"use client";

import { useState } from "react";
import { cleanupImages } from "@/lib/maintenance";
import { Brush, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function MaintenanceSettings() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleCleanup = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await cleanupImages();
            if (res.success) {
                setResult({
                    type: 'success',
                    message: `Librería limpia. Se eliminaron ${res.count} imágenes huérfanas.`
                });
            } else {
                setResult({
                    type: 'error',
                    message: `Error: ${res.error}`
                });
            }
        } catch (e) {
            setResult({ type: 'error', message: "Error inesperado al ejecutar el mantenimiento." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Brush className="w-6 h-6 text-purple-600" />
                Mantenimiento del Sistema
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Herramientas para optimizar el almacenamiento y rendimiento.</p>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Limpieza de Imágenes</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
                        Escanea la carpeta de subidas y elimina cualquier archivo de imagen
                        que no esté siendo utilizado por ningún sitio en la base de datos.
                    </p>
                </div>
                <button
                    onClick={handleCleanup}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brush className="w-4 h-4" />}
                    Limpiar Librería
                </button>
            </div>

            {result && (
                <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${result.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800'
                    : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    {result.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {result.message}
                </div>
            )}
        </section>
    );
}
