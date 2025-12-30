"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Menu,
    X,
    Map as MapIcon,
    User,
    LogOut,
    ChevronRight,
    Home,
    UtensilsCrossed,
    Backpack,
    Settings
} from "lucide-react";
import { logout } from "@/lib/actions";

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const menuItems = [
        { name: "Puntos de Interés", href: "/", icon: MapIcon },
        { name: "Food Check", href: "/food-check", icon: UtensilsCrossed },
        { name: "Gear Check", href: "/gear-check", icon: Backpack },
        { name: "Configuración", href: "/settings", icon: Settings },
    ];

    const closeSidebar = () => setIsOpen(false);

    if (pathname === "/login") return null;

    return (
        <>
            {/* Mobile Toggle Button (Hidden on Desktop) */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 left-4 z-[1001] p-2 bg-white/90 dark:bg-gray-900/90 rounded-full shadow-lg backdrop-blur-sm border border-gray-200 dark:border-gray-800 lg:hidden pointer-events-auto transition-transform active:scale-95"
                aria-label="Abrir menú"
            >
                <Menu className="h-6 w-6 text-gray-800 dark:text-white" />
            </button>

            {/* Backdrop (Mobile Only) */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm transition-opacity lg:hidden"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`fixed top-0 z-[2001] h-full w-72 bg-white dark:bg-gray-950 transform transition-transform duration-300 ease-in-out
          left-0 border-r border-gray-200 dark:border-gray-800 ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0`}
            >
                <div className="flex flex-col h-full p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <img src="/icon-192.png" alt="Park4Mikines Logo" className="w-10 h-10 rounded-xl shadow-sm border border-black/5 dark:border-white/10" />
                            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                                Park4Mikines
                            </span>
                        </div>
                        {/* Close Button (Mobile Only) */}
                        <button
                            onClick={closeSidebar}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors lg:hidden"
                            aria-label="Cerrar menú"
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-2">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={closeSidebar}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isActive
                                        ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className={`h-5 w-5 ${isActive ? "text-indigo-600" : ""}`} />
                                        <span className="font-medium">{item.name}</span>
                                    </div>
                                    {isActive && <ChevronRight className="h-4 w-4" />}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer / User Actions */}
                    <div className="pt-6 border-t border-gray-100 dark:border-gray-900">
                        <form action={logout}>
                            <button
                                type="submit"
                                className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors font-medium"
                            >
                                <LogOut className="h-5 w-5" />
                                <span>Cerrar Sesión</span>
                            </button>
                        </form>
                    </div>
                </div>
            </aside>
        </>
    );
}
