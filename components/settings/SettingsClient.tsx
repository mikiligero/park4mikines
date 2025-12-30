"use client";

import { useState } from "react";
import ProfileSettings from "./ProfileSettings";
import AppearanceSettings from "./AppearanceSettings";
import MaintenanceSettings from "./MaintenanceSettings";
import BackupSettings from "./BackupSettings";
import { User, Monitor, Brush, Database } from "lucide-react";

export default function SettingsClient({ user, isAdmin }: { user: any, isAdmin: boolean }) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const [activeTab, setActiveTab] = useState("profile");


    const menuItems = [
        { id: "profile", name: "Mi Perfil", icon: User, color: "text-purple-600" },
        { id: "appearance", name: "Apariencia", icon: Monitor, color: "text-blue-600" },
        ...(isAdmin ? [
            { id: "maintenance", name: "Mantenimiento", icon: Brush, color: "text-orange-600" },
            { id: "backups", name: "Copia de Seguridad", icon: Database, color: "text-emerald-600" },
        ] : []),
    ];



    return (
        <div className="space-y-6">
            {/* Horizontal Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-2 md:flex md:flex-wrap md:items-center gap-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-2 px-4 py-3 md:py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === item.id
                                ? `bg-gray-100 dark:bg-gray-700 ${item.color.replace('text-', 'text-')}`
                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                                }`}
                        >
                            <item.icon className={`w-5 h-5 md:w-4 md:h-4 ${activeTab === item.id ? item.color : "text-gray-400"}`} />
                            <span className="text-center md:text-left">{item.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            {activeTab === "profile" && <ProfileSettings user={user} />}
            {activeTab === "appearance" && <AppearanceSettings />}
            {activeTab === "maintenance" && <MaintenanceSettings />}
            {activeTab === "backups" && <BackupSettings />}

            <div className="text-center pt-8 pb-4 text-gray-400 dark:text-gray-500 text-xs">
                <p>Park4Mikines <span className="font-mono">v.0.0.0</span></p>
                <a
                    href="/CHANGELOG.md"
                    target="_blank"
                    className="hover:text-gray-600 dark:hover:text-gray-400 underline decoration-dotted transition-colors"
                >
                    Ver novedades
                </a>
            </div>
        </div>
    );
}
