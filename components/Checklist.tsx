"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, CheckCircle, Circle, RotateCcw, Pencil, Check, X } from "lucide-react";
import { addChecklistItem, toggleChecklistItem, deleteChecklistItem, resetChecklistItems, deleteChecklistCategory, renameChecklistItem } from "@/lib/actions";
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

function InlineAddForm({ type, categoryId }: { type: string, categoryId: number | null }) {
    const [text, setText] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || isAdding) return;
        setIsAdding(true);
        try {
            await addChecklistItem(text, type, categoryId);
            setText("");
        } finally {
            setIsAdding(false);
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    };

    return (
        <form onSubmit={handleAdd} className="mt-2 relative">
            <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Añadir elemento..."
                disabled={isAdding}
                className="w-full px-4 py-2.5 pr-10 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm disabled:opacity-50"
            />
            <button
                type="submit"
                disabled={!text.trim() || isAdding}
                className="absolute right-1.5 top-1.5 p-1 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 disabled:opacity-50 transition-colors"
                aria-label="Añadir elemento"
            >
                <Plus className="h-5 w-5" strokeWidth={2.5} />
            </button>
        </form>
    );
}

export default function Checklist({ title, type, items, categories }: ChecklistProps) {
    const [isResetting, setIsResetting] = useState(false);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [editingText, setEditingText] = useState("");

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

    const checkedCount = visibleItems.filter((i) => i.checked).length;
    const totalCount = visibleItems.length;

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

    const visibleCategories = selectedCategoryIds.length > 0 
        ? categories.filter(c => selectedCategoryIds.includes(c.id))
        : categories;

    // Show uncategorized section if no filters applied, or if there are actually uncategorized items showing
    const showUncategorized = selectedCategoryIds.length === 0 || visibleItems.some(i => !i.categoryId);

    const categoriesToRender = [
        ...visibleCategories,
        ...(showUncategorized ? [{ id: -1, name: "Sin categoría", type }] : [])
    ];

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-3 mb-8 relative">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    {title}
                </h1>

                <button
                    onClick={handleReset}
                    disabled={isResetting || checkedCount === 0}
                    className="absolute right-0 top-0 p-2 text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                    title="Reiniciar lista"
                >
                    <RotateCcw className={`h-6 w-6 ${isResetting ? "animate-spin" : ""}`} />
                </button>

                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {checkedCount} / {totalCount} completados ({totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0}%)
                </p>
                {/* Progress Bar */}
                <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out"
                        style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
                    />
                </div>
            </div>

            {/* Category Filter Bar */}
            <ChecklistCategoryBar
                type={type}
                categories={categories}
                selectedIds={selectedCategoryIds}
                onToggle={handleToggleCategory}
            />

            {/* Grouped List Blocks */}
            <div className="space-y-6">
                {categoriesToRender.length === 0 && categories.length > 0 ? (
                    <div className="text-center py-12 text-gray-400 dark:text-gray-600 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                        <p>No has seleccionado ninguna categoría visible.</p>
                    </div>
                ) : (
                    categoriesToRender.map(cat => {
                        const isUncategorized = cat.id === -1;
                        const catItems = visibleItems.filter(i => isUncategorized ? !i.categoryId : i.categoryId === cat.id);

                        // If it's the uncategorized bucket and we are filtering but it's empty, skip it to save space
                        if (isUncategorized && catItems.length === 0 && selectedCategoryIds.length > 0) return null;

                        // Sort within category: pending first, then alphabetical
                        const sortedCatItems = catItems.slice().sort((a, b) => {
                            if (a.checked !== b.checked) return a.checked ? 1 : -1;
                            return a.text.localeCompare(b.text, "es");
                        });

                        return (
                            <div key={cat.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
                                {/* Section Header */}
                                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 ml-1 flex items-center justify-between">
                                    <span className="flex-1">{cat.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                                            {catItems.filter(i => i.checked).length} / {catItems.length}
                                        </span>
                                        {!isUncategorized && (
                                            <button
                                                onClick={() => {
                                                    if (confirm(`¿Seguro que quieres eliminar la categoría "${cat.name}" y todas sus tareas?`)) {
                                                        deleteChecklistCategory(cat.id, type);
                                                    }
                                                }}
                                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Eliminar categoría"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </h2>

                                {/* Inline Add Form (Moved to top) */}
                                <div className="mb-4">
                                    <InlineAddForm type={type} categoryId={isUncategorized ? null : cat.id} />
                                </div>

                                {/* Items List */}
                                <div className="space-y-2 mb-2">
                                    {sortedCatItems.length === 0 ? (
                                        <div className="py-2 flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
                                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">Vacio</p>
                                        </div>
                                    ) : (
                                        sortedCatItems.map(item => (
                                            <div
                                                key={item.id}
                                                className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                                                    item.checked
                                                        ? "bg-gray-50 dark:bg-gray-900/40 border-transparent text-gray-400 dark:text-gray-600"
                                                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-900"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 flex-1 text-left min-w-0">
                                                    <button
                                                        onClick={() => toggleChecklistItem(item.id, !item.checked, type)}
                                                        className={`transition-colors flex-shrink-0 mt-0.5 ${item.checked ? "text-indigo-400" : "text-gray-300 dark:text-gray-500 hover:text-indigo-500"}`}
                                                    >
                                                        {item.checked ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                                                    </button>
                                                    
                                                    {editingItemId === item.id ? (
                                                        <div className="flex-1 flex gap-1.5 items-center mr-2" onClick={(e) => e.stopPropagation()}>
                                                            <input
                                                                type="text"
                                                                value={editingText}
                                                                onChange={(e) => setEditingText(e.target.value)}
                                                                onKeyDown={async (e) => {
                                                                    if (e.key === "Enter") {
                                                                        e.preventDefault();
                                                                        if (editingText.trim() && editingText !== item.text) {
                                                                            setEditingItemId(null);
                                                                            await renameChecklistItem(item.id, editingText.trim(), type);
                                                                        } else {
                                                                            setEditingItemId(null);
                                                                        }
                                                                    } else if (e.key === "Escape") {
                                                                        setEditingItemId(null);
                                                                    }
                                                                }}
                                                                autoFocus
                                                                className="flex-1 w-full px-2 py-1 text-sm rounded-lg bg-white dark:bg-gray-800 border border-indigo-300 dark:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingItemId(null);
                                                                }}
                                                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (editingText.trim() && editingText !== item.text) {
                                                                        setEditingItemId(null);
                                                                        await renameChecklistItem(item.id, editingText.trim(), type);
                                                                    } else {
                                                                        setEditingItemId(null);
                                                                    }
                                                                }}
                                                                className="p-1.5 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => toggleChecklistItem(item.id, !item.checked, type)}
                                                            className={`font-medium transition-all text-left truncate ${item.checked ? "line-through decoration-indigo-200 opacity-60" : ""}`}
                                                        >
                                                            {item.text}
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!item.checked && editingItemId !== item.id && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingItemId(item.id);
                                                                setEditingText(item.text);
                                                            }}
                                                            className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                            aria-label="Editar"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`¿Seguro que quieres eliminar "${item.text}"?`)) {
                                                                deleteChecklistItem(item.id, type);
                                                            }
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        aria-label="Eliminar"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
