"use client";

import { useState } from "react";
import { Plus, Trash2, CheckCircle, Circle, RotateCcw } from "lucide-react";
import { addChecklistItem, toggleChecklistItem, deleteChecklistItem, resetChecklistItems } from "@/lib/actions";

type ItemType = "FOOD" | "GEAR";

interface ChecklistItem {
    id: number;
    text: string;
    checked: boolean;
}

interface ChecklistProps {
    title: string;
    type: ItemType;
    items: ChecklistItem[];
}

export default function Checklist({ title, type, items }: ChecklistProps) {
    const [newItemText, setNewItemText] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemText.trim() || isAdding) return;

        setIsAdding(true);
        try {
            await addChecklistItem(newItemText, type);
            setNewItemText("");
        } finally {
            setIsAdding(false);
        }
    };

    const handleReset = async () => {
        if (isResetting || items.filter(i => i.checked).length === 0) return;

        if (confirm("¿Seguro que quieres desmarcar todos los elementos?")) {
            setIsResetting(true);
            try {
                await resetChecklistItems(type);
            } finally {
                setIsResetting(false);
            }
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            <div className="text-center space-y-2 mb-8 relative">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    {title}
                </h1>

                <button
                    onClick={handleReset}
                    disabled={isResetting || items.filter(i => i.checked).length === 0}
                    className="absolute right-0 top-0 p-2 text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                    title="Reiniciar lista"
                >
                    <RotateCcw className={`h-5 w-5 ${isResetting ? "animate-spin" : ""}`} />
                </button>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {items.filter(i => i.checked).length} / {items.length} completados ({items.length > 0 ? Math.round((items.filter(i => i.checked).length / items.length) * 100) : 0}%)
                </p>
                {/* Progress Bar */}
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                        style={{ width: `${items.length > 0 ? (items.filter(i => i.checked).length / items.length) * 100 : 0}%` }}
                    />
                </div>
            </div>

            {/* Add Form */}
            <form onSubmit={handleAdd} className="relative">
                <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder="Añadir nuevo elemento..."
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                />
                <button
                    type="submit"
                    disabled={!newItemText.trim() || isAdding}
                    className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                </button>
            </form>

            {/* List */}
            <div className="space-y-2">
                {items.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 dark:text-gray-600 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                        <p>Lista vacía. ¡Añade cosas para no olvidarlas!</p>
                    </div>
                ) : (
                    items.map((item) => (
                        <div
                            key={item.id}
                            className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${item.checked
                                ? "bg-gray-50 dark:bg-gray-900/50 border-transparent text-gray-400 dark:text-gray-600"
                                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-900"
                                }`}
                        >
                            <button
                                onClick={() => toggleChecklistItem(item.id, !item.checked, type)}
                                className="flex items-center gap-3 flex-1 text-left"
                            >
                                <div className={`transition-colors ${item.checked ? "text-indigo-400" : "text-gray-300 dark:text-gray-600 group-hover:text-indigo-500"}`}>
                                    {item.checked ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                                </div>
                                <span className={`font-medium transition-all ${item.checked ? "line-through decoration-indigo-200" : ""}`}>
                                    {item.text}
                                </span>
                            </button>

                            <button
                                onClick={() => deleteChecklistItem(item.id, type)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                aria-label="Eliminar"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
