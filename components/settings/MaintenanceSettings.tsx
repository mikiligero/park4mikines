"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { cleanupImages } from "@/lib/maintenance";

export default function MaintenanceSettings() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const handleCleanup = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await cleanupImages();
            setResult(res.success
                ? { type: "success", message: `Librería limpia. Se eliminaron ${res.count} imágenes huérfanas.` }
                : { type: "error",   message: `Error: ${res.error}` }
            );
        } catch {
            setResult({ type: "error", message: "Error inesperado al ejecutar el mantenimiento." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section style={{ background: "var(--surface)", borderRadius: 20, padding: "20px 20px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Icon name="brush" size={18} style={{ color: "var(--warning)" }} />
                <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)", margin: 0 }}>
                    Mantenimiento del sistema
                </h2>
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18 }}>
                Optimiza el almacenamiento y el rendimiento.
            </p>

            {/* Card limpieza */}
            <div style={{
                background: "var(--surface-2)", borderRadius: 16,
                border: "1px solid var(--border)", padding: "16px 18px",
            }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>
                    Limpieza de imágenes
                </p>
                <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
                    Elimina las imágenes guardadas que ya no estén asociadas a ningún lugar.
                </p>
                <button
                    onClick={handleCleanup}
                    disabled={loading}
                    className="btn btn-ghost btn-sm"
                    style={{ gap: 6 }}
                >
                    <Icon
                        name="brush"
                        size={15}
                        style={{ animation: loading ? "spin .8s linear infinite" : "none" }}
                    />
                    Limpiar librería
                </button>
            </div>

            {result && (
                <div style={{
                    marginTop: 14, display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                    background: result.type === "success" ? "var(--success-soft)" : "var(--danger-soft)",
                    color: result.type === "success" ? "var(--success)" : "var(--danger)",
                }}>
                    <Icon name={result.type === "success" ? "check" : "close"} size={14} />
                    {result.message}
                </div>
            )}
        </section>
    );
}
