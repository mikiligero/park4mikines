/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), {
    ssr: false,
    loading: () => (
        <div style={{
            display: "flex", height: "100vh", width: "100%",
            alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 14, background: "var(--bg)",
        }}>
            <div style={{
                width: 40, height: 40, borderRadius: "50%",
                border: "3px solid var(--border)",
                borderTopColor: "var(--primary)",
                animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ color: "var(--muted)", fontSize: 14, fontWeight: 600, margin: 0 }}>
                Cargando mapa…
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    ),
});

export default function MapLazy(props: any) {
    return <Map {...props} />;
}
