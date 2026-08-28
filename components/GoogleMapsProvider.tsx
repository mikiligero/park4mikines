"use client";

import { type ReactNode, useEffect, useState } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";

interface Props {
    children: ReactNode;
}

export default function GoogleMapsProvider({ children }: Props) {
    const [apiKey, setApiKey] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/maps/config", { cache: "no-store" })
            .then(async response => {
                if (!response.ok) throw new Error("Google Maps no está configurado.");
                return response.json();
            })
            .then(data => setApiKey(data.apiKey))
            .catch(() => setApiKey(""));
    }, []);

    if (apiKey === null) return <div className="h-full w-full" />;
    if (!apiKey) return <div className="grid h-full w-full place-items-center text-sm text-[var(--muted)]">No se pudo cargar Google Maps.</div>;

    return <APIProvider apiKey={apiKey} language="es" region="ES">{children}</APIProvider>;
}
