"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";

export const PALETTES = ["bosque", "atardecer", "indigo"] as const;
export type Palette = typeof PALETTES[number];

export function getPalette(): Palette {
    if (typeof window === "undefined") return "bosque";
    return (localStorage.getItem("palette") as Palette) || "bosque";
}

export function setPalette(p: Palette) {
    localStorage.setItem("palette", p);
    if (p === "bosque") {
        document.documentElement.removeAttribute("data-palette");
    } else {
        document.documentElement.setAttribute("data-palette", p);
    }
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";

    useEffect(() => {
        const p = getPalette();
        if (p !== "bosque") document.documentElement.setAttribute("data-palette", p);
    }, []);

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
            {!isLoginPage && <Sidebar />}
            <main
                className={`w-full h-screen focus:outline-none ${!isLoginPage ? "main-with-rail" : ""}`}
                style={{ background: "var(--bg)", color: "var(--text)" }}
            >
                {children}
            </main>
        </div>
    );
}
