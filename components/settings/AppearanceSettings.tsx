"use client";

import { useTheme } from "next-themes";
import { Icon } from "@/components/Icon";
import { useEffect, useState } from "react";
import { type Palette, getPalette, setPalette } from "@/components/LayoutWrapper";

const PALETTE_OPTIONS: { value: Palette; label: string; primary: string; dark: string }[] = [
    { value: "bosque",    label: "Bosque",    primary: "#1F7A52", dark: "#16261D" },
    { value: "atardecer", label: "Atardecer", primary: "#B85C38", dark: "#271510" },
    { value: "indigo",    label: "Índigo",    primary: "#5048E5", dark: "#16163E" },
];

function PaletteSwatch({ primary, dark }: { primary: string; dark: string }) {
    return (
        <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
            <circle cx="11" cy="11" r="11" fill={primary} />
            <circle cx="22" cy="11" r="11" fill={dark} />
            <rect x="28" y="7" width="8" height="8" rx="4" fill="#ccc" />
            <circle cx="30" cy="11" r="3" fill="white" />
        </svg>
    );
}

export default function AppearanceSettings() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [palette, setPaletteState] = useState<Palette>("bosque");

    useEffect(() => {
        setMounted(true);
        setPaletteState(getPalette());
    }, []);

    if (!mounted) return null;

    const isDark = theme === "dark";

    function handlePalette(p: Palette) {
        setPaletteState(p);
        setPalette(p);
    }

    return (
        <section style={{ background: "var(--surface)", borderRadius: 20, padding: "20px 20px", border: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)", marginBottom: 4 }}>
                Apariencia
            </h2>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
                Personaliza el aspecto de la app.
            </p>

            {/* Toggle modo oscuro */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px", borderRadius: 14, background: "var(--surface-2)",
                marginBottom: 20,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Icon name="moon" size={18} style={{ color: "var(--muted)" }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Modo oscuro</span>
                </div>
                <button
                    className={`switch ${isDark ? "is-on" : ""}`}
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    aria-label="Modo oscuro"
                >
                    <span />
                </button>
            </div>

            {/* Color de la app */}
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", marginBottom: 10 }}>
                Color de la app
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {PALETTE_OPTIONS.map(opt => {
                    const active = palette === opt.value;
                    return (
                        <button
                            key={opt.value}
                            onClick={() => handlePalette(opt.value)}
                            style={{
                                display: "flex", flexDirection: "column", alignItems: "center",
                                padding: "14px 8px 12px", borderRadius: 14, border: "2px solid",
                                borderColor: active ? opt.primary : "var(--border)",
                                background: "var(--surface-2)",
                                cursor: "pointer", gap: 8, transition: "all .15s",
                            }}
                        >
                            <PaletteSwatch primary={opt.primary} dark={opt.dark} />
                            <span style={{
                                fontSize: 13, fontWeight: 700,
                                color: active ? "var(--text)" : "var(--text-2)",
                            }}>
                                {opt.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
