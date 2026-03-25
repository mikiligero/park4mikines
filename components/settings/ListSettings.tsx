"use client";

import { useState } from "react";
import { List, Eye, EyeOff, Edit, Trash2, Plus, GripVertical } from "lucide-react";
import { createList, updateList, toggleListVisibility, deleteList } from "@/lib/actions";

export default function ListSettings({ lists }: { lists: any[] }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingList, setEditingList] = useState<any | null>(null);
    const [newListMode, setNewListMode] = useState(false);
    const [name, setName] = useState("");
    const [icon, setIcon] = useState("List");

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const res = await createList({ name, type: name, icon, isVisible: true });
        if (res.success) {
            setNewListMode(false);
            setName("");
            setIcon("List");
        } else {
            alert(res.error);
        }
        setIsSubmitting(false);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingList) return;
        setIsSubmitting(true);
        const res = await updateList(editingList.id, { name, icon });
        if (res.success) {
            setEditingList(null);
            setName("");
            setIcon("List");
        } else {
            alert(res.error);
        }
        setIsSubmitting(false);
    };

    const handleToggleVisibility = async (id: number, currentVisibility: boolean) => {
        await toggleListVisibility(id, !currentVisibility);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Seguro que quieres eliminar esta lista? Se eliminarán todos sus elementos.")) return;
        await deleteList(id);
    };

    const startEditing = (list: any) => {
        setEditingList(list);
        setName(list.name);
        setIcon(list.icon);
    };

    const cancelEditing = () => {
        setEditingList(null);
        setNewListMode(false);
        setName("");
        setIcon("List");
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <List className="w-6 h-6 text-pink-500" />
                        Listas Configurables
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Añade, edita u oculta las listas del menú lateral.
                    </p>
                </div>
                {!newListMode && !editingList && (
                    <button
                        onClick={() => setNewListMode(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors font-medium text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Añadir Lista
                    </button>
                )}
            </div>

            <div className="p-6">
                {(newListMode || editingList) ? (
                    <form onSubmit={editingList ? handleUpdate : handleCreate} className="space-y-4 bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre de la Lista</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icono (Lucide)</label>
                            <input
                                type="text"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                className="w-full px-4 py-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 dark:text-white"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Introduce el nombre de un icono de <a href="https://lucide.dev/icons" target="_blank" className="text-indigo-500 underline">Lucide Icons</a>.</p>
                        </div>
                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                type="button"
                                onClick={cancelEditing}
                                className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors font-medium text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium text-sm disabled:opacity-50"
                            >
                                {isSubmitting ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-3">
                        {lists.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No hay listas configuradas.</div>
                        ) : (
                            lists.map((list) => (
                                <div key={list.id} className={`flex items-center justify-between p-4 bg-white dark:bg-gray-950 border ${list.isVisible ? 'border-gray-200 dark:border-gray-800' : 'border-gray-200/50 dark:border-gray-800/50 opacity-60'} rounded-xl transition-colors`}>
                                    <div className="flex items-center gap-3">
                                        <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                                        <div className={`p-2 rounded-lg ${list.isVisible ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-gray-50 dark:bg-gray-900 text-gray-500'}`}>
                                            <List className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-900 dark:text-white">{list.name}</span>
                                            <div className="text-xs text-gray-500 font-mono mt-0.5">Type: {list.type}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleVisibility(list.id, list.isVisible)}
                                            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                            title={list.isVisible ? "Ocultar en menú" : "Mostrar en menú"}
                                        >
                                            {list.isVisible ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => startEditing(list)}
                                            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(list.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
