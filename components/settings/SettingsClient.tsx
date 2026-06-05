"use client";

import { useState } from "react";
import ProfileSettings from "./ProfileSettings";
import AppearanceSettings from "./AppearanceSettings";
import MaintenanceSettings from "./MaintenanceSettings";
import BackupSettings from "./BackupSettings";
import ListSettings from "./ListSettings";
import { Icon, type IconName } from "@/components/Icon";

type TabId = "profile" | "appearance" | "lists" | "maintenance" | "backups";

interface Tab {
    id: TabId;
    name: string;
    icon: IconName;
    activeBg: string;
    activeColor: string;
}

const ALL_TABS: Tab[] = [
    { id: "profile",     name: "Mi Perfil",         icon: "user",     activeBg: "var(--primary-soft)",          activeColor: "var(--primary-soft-text)" },
    { id: "appearance",  name: "Apariencia",         icon: "monitor",  activeBg: "rgba(80,72,229,0.10)",         activeColor: "#4338CA" },
    { id: "lists",       name: "Listas",             icon: "list",     activeBg: "rgba(80,72,229,0.10)",         activeColor: "#4338CA" },
    { id: "maintenance", name: "Mantenimiento",      icon: "edit",     activeBg: "rgba(224,162,26,0.14)",        activeColor: "var(--warning)" },
    { id: "backups",     name: "Copia de seguridad", icon: "database", activeBg: "var(--success-soft)",          activeColor: "var(--success)" },
];

export default function SettingsClient({ user, isAdmin, lists }: { user: any; isAdmin: boolean; lists?: any[] }) {
    const [activeTab, setActiveTab] = useState<TabId>("profile");

    const tabs = isAdmin
        ? ALL_TABS
        : ALL_TABS.filter(t => t.id === "profile" || t.id === "appearance");

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Nav grid */}
            <div style={{
                background: "var(--surface)",
                borderRadius: 20,
                border: "1px solid var(--border)",
                padding: 12,
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 8,
            }}>
                {tabs.map((tab, i) => {
                    const active = activeTab === tab.id;
                    const isLast = i === tabs.length - 1;
                    const isAlone = isLast && tabs.length % 2 === 1;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                gridColumn: isAlone ? "1 / -1" : undefined,
                                display: "flex", flexDirection: "column",
                                alignItems: "center", justifyContent: "center",
                                gap: 6, padding: "14px 8px", borderRadius: 14, border: "none",
                                cursor: "pointer", transition: "background .15s, color .15s",
                                background: active ? tab.activeBg : "transparent",
                                color: active ? tab.activeColor : "var(--muted)",
                            }}
                        >
                            <Icon name={tab.icon} size={22} />
                            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "-0.01em" }}>
                                {tab.name}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Contenido */}
            {activeTab === "profile"     && <ProfileSettings user={user} />}
            {activeTab === "appearance"  && <AppearanceSettings />}
            {activeTab === "lists"       && isAdmin && lists && <ListSettings lists={lists} />}
            {activeTab === "maintenance" && <MaintenanceSettings />}
            {activeTab === "backups"     && <BackupSettings />}

            <div style={{ textAlign: "center", paddingTop: 4, paddingBottom: 8 }}>
                <p style={{ fontSize: 12, color: "var(--faint)", margin: 0, fontFamily: "var(--mono)" }}>
                    Park4Mikines · v1.0
                </p>
            </div>
        </div>
    );
}
