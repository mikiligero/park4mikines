"use client";

import { useState, useTransition } from "react";
import { Plus, X, Tag } from "lucide-react";
import { addChecklistCategory } from "@/lib/actions";

type ItemType = string;

interface Category {
    id: number;
    name: string;
    type: string;
}

interface ChecklistCategoryBarProps {
    type: ItemType;
    categories: Category[];
    selectedIds: number[];
    onToggle: (id: number) => void;
}

export default function ChecklistCategoryBar({
    type,
    categories,
    selectedIds,
    onToggle,
}: ChecklistCategoryBarProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleAdd = () => {
        if (!newName.trim() || isPending) return;
        startTransition(async () => {
            await addChecklistCategory(newName.trim(), type);
            setNewName("");
            setIsAdding(false);
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleAdd();
        if (e.key === "Escape") { setIsAdding(false); setNewName(""); }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-1.5 flex-wrap">
                <Tag className="h-4 w-4 text-gray-400 flex-shrink-0" />
                {categories.length === 0 && !isAdding && (
                    <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                        Sin categorías
                    </span>
                )}
                {categories.map((cat) => {
                    const isSelected = selectedIds.includes(cat.id);
                    return (
                        <div
                            key={cat.id}
                            className={`group flex items-center justify-center px-5 py-2.5 rounded-full text-base font-medium transition-all shadow-sm cursor-pointer whitespace-nowrap ${
                                isSelected
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/30"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }`}
                            onClick={() => onToggle(cat.id)}
                        >
                            <span>{cat.name}</span>
                        </div>
                    );
                })}

                {isAdding ? (
                    <div className="flex items-center gap-1">
                        <input
                            autoFocus
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Nombre..."
                            className="h-7 px-2 text-sm rounded-full border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-32"
                        />
                        <button
                            onClick={handleAdd}
                            disabled={!newName.trim() || isPending}
                            className="h-7 px-3 bg-indigo-600 text-white text-sm rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            OK
                        </button>
                        <button
                            onClick={() => { setIsAdding(false); setNewName(""); }}
                            className="h-7 w-7 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="h-7 w-7 flex items-center justify-center rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                        title="Nueva categoría"
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}
