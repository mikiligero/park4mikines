"use client";

import { useEffect, useState, createElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { Icon, type IconName } from "@/components/Icon";
import { getVisibleLists } from "@/lib/actions";

// Lazy-load LucideIcon para no incluir lucide-react en el bundle principal
const LucideIcon = dynamic(
    () => import("@/components/LucideIcon").then(m => ({ default: m.LucideIcon })),
    { ssr: false, loading: () => <span style={{ width: 22, height: 22, display: "block" }} /> }
);

// Detecta si un nombre es PascalCase (icono Lucide) o lowercase (icono custom)
function isLucideName(name: string) { return /^[A-Z]/.test(name); }

interface NavItem {
    label: string;
    href: string;
    icon: string; // IconName (custom) o PascalCase (Lucide)
}

export default function Sidebar() {
    const [lists, setLists] = useState<any[]>([]);
    const pathname = usePathname();
    const { resolvedTheme, setTheme } = useTheme();

    useEffect(() => {
        const fetch = () => getVisibleLists().then(setLists);
        fetch();
        window.addEventListener("lists-updated", fetch);
        return () => window.removeEventListener("lists-updated", fetch);
    }, []);

    if (pathname === "/login") return null;

    const navItems: NavItem[] = [
        { label: "Explorar",  href: "/pois",      icon: "map"      },
        { label: "Pernoctas", href: "/pernoctas",  icon: "moon"     },
        ...lists.map(l => ({
            label: l.name,
            href: `/lists/${l.type}`,
            icon: l.icon ?? "list",
        })),
        { label: "Ajustes",   href: "/settings",  icon: "settings" },
    ];

    const isActive = (href: string) =>
        href === "/" ? pathname === "/" : pathname.startsWith(href);

    const isDark = resolvedTheme === "dark";

    return (
        <aside
            className="rail"
            style={{
                position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 800,
                flexDirection: "column", alignItems: "center",
                padding: "20px 0 24px",
            }}
        >
            {/* Logo → home */}
            <Link href="/" style={{ marginBottom: 20 }}>
                <img
                    src="/icon-192.png"
                    alt="Park4Mikines"
                    style={{ width: 44, height: 44, borderRadius: 13, border: "1px solid var(--border)", display: "block" }}
                />
            </Link>

            {/* Nav items */}
            <nav style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, width: "100%" }}>
                {navItems.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        style={{ display: "flex", justifyContent: "center", width: "100%", textDecoration: "none" }}
                    >
                        <div className={`rail-item ${isActive(item.href) ? "is-active" : ""}`}>
                            {isLucideName(item.icon)
                                ? <LucideIcon name={item.icon} size={22} />
                                : <Icon name={item.icon as IconName} size={22} />}
                            <span>{item.label}</span>
                        </div>
                    </Link>
                ))}
            </nav>

            {/* Bottom: dark mode toggle + FAB */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                {/* Oscuro / Claro toggle (rail-item style) */}
                <button
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    className="rail-item"
                    style={{ border: "none", cursor: "pointer", background: "transparent" }}
                    title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                >
                    <Icon name={isDark ? "sun" : "moon"} size={20} />
                    <span>{isDark ? "Claro" : "Oscuro"}</span>
                </button>

                {/* FAB + */}
                <Link href="/pois" style={{ textDecoration: "none" }}>
                    <div style={{
                        width: 52, height: 52, borderRadius: 99,
                        background: "var(--primary)", color: "var(--on-primary)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "var(--shadow-md)",
                        transition: "filter .15s, transform .1s",
                    }}>
                        <Icon name="plus" size={26} />
                    </div>
                </Link>
            </div>
        </aside>
    );
}
