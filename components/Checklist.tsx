"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle, Circle, RotateCcw } from "lucide-react";
import { addChecklistItem, toggleChecklistItem, deleteChecklistItem, resetChecklistItems } from "@/lib/actions";
import ChecklistCategoryBar from "@/components/ChecklistCategoryBar";

type ItemType = string;

interface Category {
    id: number;
    name: string;
    type: string;
}

interface ChecklistItem {
    id: number;
    text: string;
    checked: boolean;
    categoryId?: number | null;
}

interface ChecklistProps {
    title: string;
    type: ItemType;
    items: ChecklistItem[];
    categories: Category[];
}

export default function Checklist({ title, type, items, categories }: ChecklistProps) {
    const [newItemText, setNewItemText] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
    const [newItemCategoryId, setNewItemCategoryId] = useState<number | "">("");
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(`selected_categories_${type}`);
        if (saved) {
            try {
                setSelectedCategoryIds(JSON.parse(saved));
            } catch (e) {
                console.error("Error parsing saved categories", e);
            }
        }
        setIsLoaded(true);
    }, [type]);

    // Save to localStorage when selection changes, but only after loading
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(`selected_categories_${type}`, JSON.stringify(selectedCategoryIds));
        }
    }, [selectedCategoryIds, type, isLoaded]);

    const handleToggleCategory = (id: number) => {
        setSelectedCategoryIds((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        );
    };

    // Filter items: if categories are selected, only show items in those categories
    const visibleItems = selectedCategoryIds.length === 0
        ? items
        : items.filter((item) => item.categoryId && selectedCategoryIds.includes(item.categoryId));

    // Sort: pending first, then by category name, then by item text
    const sortedItems = visibleItems.slice().sort((a, b) => {
        // 1. Checked items go to the bottom
        if (a.checked !== b.checked) return a.checked ? 1 : -1;
        // 2. Sort by category name (no category → empty string, sorts first)
        const catA = a.categoryId ? (categories.find((c) => c.id === a.categoryId)?.name ?? "") : "";
        const catB = b.categoryId ? (categories.find((c) => c.id === b.categoryId)?.name ?? "") : "";
        if (catA !== catB) return catA.localeCompare(catB, "es");
        // 3. Sort by item text
        return a.text.localeCompare(b.text, "es");
    });

    const checkedCount = visibleItems.filter((i) => i.checked).length;
    const totalCount = visibleItems.length;

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemText.trim() || isAdding) return;

        setIsAdding(true);
        try {
            await addChecklistItem(
                newItemText,
                type,
                newItemCategoryId !== "" ? newItemCategoryId : null
            );
            setNewItemText("");
        } finally {
            setIsAdding(false);
        }
    };

    const handleReset = async () => {
        if (isResetting || checkedCount === 0) return;

        const scope = selectedCategoryIds.length > 0
            ? `los elementos de las categorías seleccionadas`
            : `todos los elementos`;

        if (confirm(`¿Seguro que quieres desmarcar ${scope}?`)) {
            setIsResetting(true);
            try {
                // If categories are selected, reset one by one
                if (selectedCategoryIds.length > 0) {
                    for (const catId of selectedCategoryIds) {
                        await resetChecklistItems(type, catId);
                    }
                } else {
                    await resetChecklistItems(type);
                }
            } finally {
                setIsResetting(false);
            }
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2 mb-6 relative">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    {title}
                </h1>

                <button
                    onClick={handleReset}
                    disabled={isResetting || checkedCount === 0}
                    className="absolute right-0 top-0 p-2 text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                    title="Reiniciar lista"
                >
                    <RotateCcw className={`h-5 w-5 ${isResetting ? "animate-spin" : ""}`} />
                </button>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {checkedCount} / {totalCount} completados ({totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0}%)
                </p>
                {/* Progress Bar */}
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                        style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
                    />
                </div>
            </div>

            {/* Category Bar */}
            <ChecklistCategoryBar
                type={type}
                categories={categories}
                selectedIds={selectedCategoryIds}
                onToggle={handleToggleCategory}
            />

            {/* Add Form */}
            <form onSubmit={handleAdd} className="space-y-2">
                <div className="relative">
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
                </div>
                {/* Category selector for new item */}
                {categories.length > 0 && (
                    <select
                        value={newItemCategoryId}
                        onChange={(e) => setNewItemCategoryId(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    >
                        <option value="">Sin categoría</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                )}
            </form>

            {/* List */}
            <div className="space-y-2">
                {sortedItems.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 dark:text-gray-600 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                        <p>
                            {selectedCategoryIds.length > 0
                                ? "No hay elementos en las categorías seleccionadas."
                                : "Lista vacía. ¡Añade cosas para no olvidarlas!"}
                        </p>
                    </div>
                ) : (
                    sortedItems.map((item) => {
                        const cat = item.categoryId
                            ? categories.find((c) => c.id === item.categoryId)
                            : null;
                        return (
                            <div
                                key={item.id}
                                className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                                    item.checked
                                        ? "bg-gray-50 dark:bg-gray-900/50 border-transparent text-gray-400 dark:text-gray-600"
                                        : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-900"
                                }`}
                            >
                                <button
                                    onClick={() => toggleChecklistItem(item.id, !item.checked, type)}
                                    className="flex items-center gap-3 flex-1 text-left"
                                >
                                    <div className={`transition-colors flex-shrink-0 ${item.checked ? "text-indigo-400" : "text-gray-300 dark:text-gray-600 group-hover:text-indigo-500"}`}>
                                        {item.checked ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                                    </div>
                                    <div className="min-w-0">
                                        <span className={`font-medium transition-all ${item.checked ? "line-through decoration-indigo-200" : ""}`}>
                                            {item.text}
                                        </span>
                                        {cat && (
                                            <span className="block text-xs text-indigo-400 dark:text-indigo-500 mt-0.5">
                                                {cat.name}
                                            </span>
                                        )}
                                    </div>
                                </button>

                                <button
                                    onClick={() => deleteChecklistItem(item.id, type)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                    aria-label="Eliminar"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
