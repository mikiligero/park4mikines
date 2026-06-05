"use client";

import { useState, useRef } from "react";
import { Icon } from "@/components/Icon";
import { createBackup, restoreBackup } from "@/lib/backup";

export default function BackupSettings() {
    const [loadingBackup, setLoadingBackup]   = useState(false);
    const [loadingRestore, setLoadingRestore] = useState(false);
    const [message, setMessage]               = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [selectedFile, setSelectedFile]     = useState<File | null>(null);
    const [logs, setLogs]                     = useState<string[]>([]);
    const fileInputRef                        = useRef<HTMLInputElement>(null);

    const handleDownload = async () => {
        setLoadingBackup(true);
        setMessage(null);
        try {
            const res = await createBackup();
            if (res.success && res.base64) {
                const bytes = atob(res.base64);
                const arr   = new Uint8Array(bytes.length).map((_, i) => bytes.charCodeAt(i));
                const blob  = new Blob([arr], { type: "application/zip" });
                const url   = URL.createObjectURL(blob);
                const a     = Object.assign(document.createElement("a"), {
                    href: url,
                    download: `park4mikines-backup-${new Date().toISOString().slice(0, 10)}.zip`,
                });
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(a);
                setMessage({ type: "success", text: "Copia de seguridad descargada correctamente." });
            } else {
                setMessage({ type: "error", text: `Error: ${res.error}` });
            }
        } catch {
            setMessage({ type: "error", text: "Error al generar la copia de seguridad." });
        } finally {
            setLoadingBackup(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { setSelectedFile(file); setMessage(null); setLogs([]); }
    };

    const executeRestore = async () => {
        if (!selectedFile) return;
        setLoadingRestore(true);
        setMessage(null);
        const now = new Date().toLocaleTimeString("es-ES", { hour12: false });
        setLogs([`[${now}] Iniciando conexión con el servidor...`, `[${now}] Subiendo archivo ${selectedFile.name}...`]);
        const fd = new FormData();
        fd.append("backupFile", selectedFile);
        try {
            const res = await restoreBackup(fd);
            if (res.logs) setLogs(p => [...p, ...res.logs!]);
            setMessage(res.success
                ? { type: "success", text: "Restauración completada con éxito." }
                : { type: "error",   text: `Error en la restauración: ${res.error}` }
            );
        } catch {
            setMessage({ type: "error", text: "Error crítico durante la restauración." });
        } finally {
            setLoadingRestore(false);
        }
    };

    const clearFile = () => {
        setSelectedFile(null); setLogs([]); setMessage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <section style={{ background: "var(--surface)", borderRadius: 20, padding: "20px 20px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Icon name="database" size={18} style={{ color: "var(--success)" }} />
                <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)", margin: 0 }}>
                    Copia de seguridad
                </h2>
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18 }}>Exporta o restaura tus datos.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* ── Exportar ── */}
                <div style={{ background: "var(--surface-2)", borderRadius: 16, border: "1px solid var(--border)", padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <Icon name="save" size={15} style={{ color: "var(--primary)" }} />
                        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: 0 }}>Exportar copia</p>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
                        Descarga un archivo con tus lugares, favoritos y listas.
                    </p>
                    <button
                        onClick={handleDownload}
                        disabled={loadingBackup}
                        className="btn btn-primary btn-md btn-full"
                        style={{ gap: 8 }}
                    >
                        <Icon
                            name="download"
                            size={16}
                            style={{ animation: loadingBackup ? "spin .8s linear infinite" : "none" }}
                        />
                        Descargar copia
                    </button>
                </div>

                {/* ── Restaurar ── */}
                <div style={{ background: "var(--surface-2)", borderRadius: 16, border: "1px solid var(--border)", padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <Icon name="upload" size={15} style={{ color: "var(--warning)" }} />
                        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: 0 }}>Restaurar copia</p>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
                        Sube un archivo de copia para recuperar tus datos.
                    </p>

                    {!selectedFile ? (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="btn btn-ghost btn-md btn-full"
                            style={{ gap: 8 }}
                        >
                            <Icon name="upload" size={16} />
                            Seleccionar archivo
                        </button>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {/* Archivo seleccionado */}
                            <div style={{
                                display: "flex", alignItems: "center", gap: 10,
                                padding: "10px 14px", borderRadius: 12,
                                background: "var(--surface)", border: "1px solid var(--border)",
                            }}>
                                <Icon name="database" size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {selectedFile.name}
                                    </p>
                                    <p style={{ fontSize: 11, color: "var(--faint)", margin: 0, fontFamily: "var(--mono)" }}>
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                                <button onClick={clearFile} className="btn btn-ghost btn-sm" style={{ flexShrink: 0, fontSize: 12 }}>
                                    Cambiar
                                </button>
                            </div>

                            {/* Logs (durante restore) */}
                            {(loadingRestore || logs.length > 0) && (
                                <div style={{
                                    background: "#0D0D0D", borderRadius: 12, padding: "12px 16px",
                                    fontFamily: "var(--mono)", fontSize: 12, color: "#4ADE80",
                                    height: 200, overflowY: "auto",
                                }}>
                                    {logs.map((l, i) => <div key={i} style={{ marginBottom: 4 }}>{l}</div>)}
                                    {loadingRestore && <div style={{ opacity: 0.5 }}>_</div>}
                                </div>
                            )}

                            {/* Aviso destructivo + botón (solo si no hay logs) */}
                            {!loadingRestore && logs.length === 0 && (
                                <>
                                    <div style={{
                                        padding: "12px 14px", borderRadius: 12,
                                        background: "var(--danger-soft)", color: "var(--danger)",
                                        fontSize: 13, fontWeight: 600, lineHeight: 1.5,
                                        display: "flex", gap: 8, alignItems: "flex-start",
                                    }}>
                                        <Icon name="close" size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                                        Al restaurar se <strong>eliminarán todos los datos actuales</strong>. Esta acción no se puede deshacer.
                                    </div>
                                    <button
                                        onClick={executeRestore}
                                        className="btn btn-danger btn-lg btn-full"
                                        style={{ gap: 8 }}
                                    >
                                        <Icon name="upload" size={18} />
                                        Confirmar y restaurar
                                    </button>
                                </>
                            )}

                            {/* Botón finalizar tras éxito */}
                            {message?.type === "success" && (
                                <button onClick={() => window.location.reload()} className="btn btn-primary btn-md btn-full" style={{ gap: 8 }}>
                                    <Icon name="check" size={16} />
                                    Finalizar y recargar
                                </button>
                            )}
                        </div>
                    )}

                    <input
                        type="file" ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".zip"
                        style={{ display: "none" }}
                    />
                </div>
            </div>

            {/* Mensaje global */}
            {message && (
                <div style={{
                    marginTop: 14, display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                    background: message.type === "success" ? "var(--success-soft)" : "var(--danger-soft)",
                    color: message.type === "success" ? "var(--success)" : "var(--danger)",
                }}>
                    <Icon name={message.type === "success" ? "check" : "close"} size={14} />
                    {message.text}
                </div>
            )}
        </section>
    );
}
