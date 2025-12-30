"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export default function AppearanceSettings() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Apariencia</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Personaliza cómo se ve la aplicación en tu dispositivo.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => setTheme("light")}
                    className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${theme === "light"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-gray-600"
                        }`}
                >
                    <Sun className={`w-8 h-8 mb-3 ${theme === "light" ? "text-emerald-600" : "text-gray-400"}`} />
                    <span className={`font-medium ${theme === "light" ? "text-emerald-900 dark:text-emerald-400" : "text-gray-600 dark:text-gray-400"}`}>Claro</span>
                </button>

                <button
                    onClick={() => setTheme("dark")}
                    className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${theme === "dark"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-gray-600"
                        }`}
                >
                    <Moon className={`w-8 h-8 mb-3 ${theme === "dark" ? "text-emerald-600" : "text-gray-400"}`} />
                    <span className={`font-medium ${theme === "dark" ? "text-emerald-900 dark:text-emerald-400" : "text-gray-600 dark:text-gray-400"}`}>Oscuro</span>
                </button>

                <button
                    onClick={() => setTheme("system")}
                    className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${theme === "system"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-gray-600"
                        }`}
                >
                    <Monitor className={`w-8 h-8 mb-3 ${theme === "system" ? "text-emerald-600" : "text-gray-400"}`} />
                    <span className={`font-medium ${theme === "system" ? "text-emerald-900 dark:text-emerald-400" : "text-gray-600 dark:text-gray-400"}`}>Automático</span>
                </button>
            </div>
        </section>
    );
}
