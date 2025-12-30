"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { toggleFavorite } from "@/lib/actions";

export default function FavoriteButton({ spotId, initialIsFavorite, className }: { spotId: number; initialIsFavorite: boolean; className?: string }) {
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    // ...
    // Note: I will need to use className in the button rendering
    const [loading, setLoading] = useState(false);

    const handleToggle = async (e: React.MouseEvent) => {
        // ... (existing logic)
        e.preventDefault();
        e.stopPropagation();
        if (loading) return;

        setLoading(true);
        const previousState = isFavorite;
        setIsFavorite(!isFavorite);

        try {
            const result = await toggleFavorite(spotId);
            if (result && 'success' in result && result.success) {
                setIsFavorite(!!result.favorited);
            } else {
                setIsFavorite(previousState);
            }
        } catch (error) {
            setIsFavorite(previousState);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            className={`p-2 rounded-full transition-colors ${isFavorite
                ? "bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:bg-gray-800 dark:text-gray-500"
                } ${className || ""}`}
        >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />}
        </button>
    );
}
