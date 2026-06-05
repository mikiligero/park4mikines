"use client";

import * as LucideIcons from "lucide-react";
import { createElement } from "react";

// Todos los nombres de iconos Lucide (PascalCase, sin alias *Icon ni helpers)
// Los iconos son forwardRef → typeof === "object", no "function", por eso filtramos por nombre
export const ALL_LUCIDE_NAMES: string[] = (
    Object.keys(LucideIcons) as string[]
)
    .filter(k => /^[A-Z][a-zA-Z0-9]+$/.test(k) && !k.endsWith("Icon"))
    .sort();

interface LucideIconProps {
    name: string;
    size?: number;
    style?: React.CSSProperties;
    className?: string;
}

export function LucideIcon({ name, size = 20, style, className }: LucideIconProps) {
    const Comp = (LucideIcons as Record<string, any>)[name];
    if (!Comp) return null;
    return createElement(Comp, { size, strokeWidth: 2, style, className });
}
