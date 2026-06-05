"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { toggleFavorite } from "@/lib/actions";

interface FavoriteButtonProps {
    spotId: number;
    initialIsFavorite: boolean;
    size?: number;
    variant?: "card" | "plain";
}

export default function FavoriteButton({
    spotId,
    initialIsFavorite,
    size = 16,
    variant = "card",
}: FavoriteButtonProps) {
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const [loading, setLoading] = useState(false);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (loading) return;

        setLoading(true);
        const previous = isFavorite;
        setIsFavorite(!isFavorite);

        try {
            const result = await toggleFavorite(spotId);
            if (result && "success" in result && result.success) {
                setIsFavorite(!!result.favorited);
            } else {
                setIsFavorite(previous);
            }
        } catch {
            setIsFavorite(previous);
        } finally {
            setLoading(false);
        }
    };

    if (variant === "plain") {
        return (
            <button
                onClick={handleToggle}
                style={{
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                    color: isFavorite ? "var(--danger)" : "var(--text-2)",
                    opacity: loading ? 0.6 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}
                aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
            >
                <Icon name="heart" size={size} filled={isFavorite} />
            </button>
        );
    }

    return (
        <button
            onClick={handleToggle}
            className="iconbtn iconbtn-surface"
            style={{
                width: 36, height: 36,
                color: isFavorite ? "var(--danger)" : "var(--muted)",
                opacity: loading ? 0.6 : 1,
            }}
            aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
        >
            <Icon name="heart" size={size} filled={isFavorite} />
        </button>
    );
}
