"use client";

import { useState, useRef } from "react";
import { createBackup, restoreBackup } from "@/lib/backup";
import { Database, Download, Upload, CheckCircle, AlertCircle, Loader2, Save } from "lucide-react";

export default function BackupSettings() {
    const [loadingBackup, setLoadingBackup] = useState(false);
    const [loadingRestore, setLoadingRestore] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadBackup = async () => {
        setLoadingBackup(true);
        setMessage(null);
        try {
            const res = await createBackup();
            if (res.success && res.base64) {
                // Convert base64 to blob and download
                const byteCharacters = atob(res.base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: "application/zip" });

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `park4mikines-backup-${new Date().toISOString().slice(0, 10)}.zip`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                setMessage({ type: 'success', text: "Copia de seguridad descargada correctamente." });
            } else {
                console.error("Backup server error:", res.error);
                setMessage({ type: 'error', text: `Error: ${res.error}` });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: "Error al generar la copia de seguridad." });
        } finally {
            setLoadingBackup(false);
        }
    };

    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setMessage(null);
            setLogs([]);
        }
    };

    const executeRestore = async () => {
        console.log("Executing restore with file:", selectedFile);
        if (!selectedFile) return;

        setLoadingRestore(true);
        setMessage(null);

        // Add fake initial connection logs for visual effect
        const now = new Date().toLocaleTimeString('es-ES', { hour12: false });
        setLogs([
            `[${now}] Iniciando conexión con el servidor...`,
            `[${now}] Subiendo archivo ${selectedFile.name}...`
        ]);

        const formData = new FormData();
        formData.append("backupFile", selectedFile);

        try {
            const res = await restoreBackup(formData);

            if (res.logs) {
                setLogs(prev => [...prev, ...res.logs!]);
            }

            if (res.success) {
                setMessage({ type: 'success', text: "Restauración completada con éxito." });
            } else {
                setMessage({ type: 'error', text: `Error en la restauración: ${res.error}` });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: "Error crítico durante la restauración." });
        } finally {
            setLoadingRestore(false);
        }
    };

    return (
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Database className="w-6 h-6 text-purple-600" />
                Copias de Seguridad
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Exporta o restaura tus datos.</p>

            <div className="space-y-4">
                {/* Export Card */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-100 dark:border-gray-600">
                    <div className="flex items-start gap-3 mb-4">
                        <Save className="w-5 h-5 text-purple-600 mt-1" />
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Exportar Copia de Seguridad</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Descarga un archivo ZIP con tus sitios, favoritos, checklist e imágenes.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDownloadBackup}
                        disabled={loadingBackup}
                        className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {loadingBackup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Descargar ZIP
                    </button>
                </div>

                {/* Import Card */}
                {/* Import Card */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-100 dark:border-gray-600">
                    <div className="flex items-start gap-3 mb-4">
                        <Upload className="w-5 h-5 text-amber-600 mt-1" />
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Restaurar Copia de Seguridad</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Sube un archivo ZIP para recuperar tus datos e imágenes.</p>
                        </div>
                    </div>

                    {!selectedFile ? (
                        <div className="mt-4">
                            <button
                                onClick={handleRestoreClick}
                                disabled={loadingRestore}
                                className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {loadingRestore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                Seleccionar ZIP
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <Database className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white truncate">{selectedFile.name}</p>
                                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedFile(null);
                                        setLogs([]);
                                        setMessage(null);
                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                    }}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"
                                >
                                    Cambiar
                                </button>
                            </div>

                            {/* Logs Console */}
                            {loadingRestore || logs.length > 0 ? (
                                <div className="bg-black rounded-lg p-4 font-mono text-xs md:text-sm text-green-400 h-64 overflow-y-auto shadow-inner">
                                    {logs.map((log, i) => (
                                        <div key={i} className="mb-1">{log}</div>
                                    ))}
                                    {loadingRestore && (
                                        <div className="animate-pulse">_</div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl flex gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-700 dark:text-red-300">
                                            Al restaurar, se <strong>eliminarán todos los datos e imágenes actuales</strong>. Asegúrate de que quieres reemplazar tu base de datos actual con este archivo.
                                        </p>
                                    </div>

                                    <button
                                        onClick={executeRestore}
                                        disabled={loadingRestore}
                                        className="w-full px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        <AlertCircle className="w-5 h-5" />
                                        Confirmar y Restaurar ZIP
                                    </button>
                                </>
                            )}

                            {message?.type === 'success' && (
                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mt-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Finalizar y Recargar
                                </button>
                            )}

                        </div>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".zip"
                        className="hidden"
                    />
                </div>
            </div>

            {message && (
                <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2 ${message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800'
                    : 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:border-red-800'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {message.text}
                </div>
            )}
        </section>
    );
}
