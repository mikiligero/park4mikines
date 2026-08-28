"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { ColorScheme, Map as GoogleMap, useMap } from "@vis.gl/react-google-maps";
import GoogleMapsProvider from "@/components/GoogleMapsProvider";

function MoveListener({ onMove }: { onMove: (lat: number, lng: number) => void }) {
    const map = useMap();
    useEffect(() => {
        if (!map) return;
        const listener = map.addListener("idle", () => {
            const center = map.getCenter();
            if (center) onMove(center.lat(), center.lng());
        });
        return () => listener.remove();
    }, [map, onMove]);
    return null;
}

function FlyTo({ position }: { position: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (map) map.panTo({ lat: position[0], lng: position[1] });
    }, [position, map]);
    return null;
}

interface Props {
    lat: number;
    lng: number;
    onMove?: (lat: number, lng: number) => void;
    flyTo?: [number, number];
    zoom?: number;
    interactive?: boolean;
}

export default function LocationPickerMap({ lat, lng, onMove, flyTo, zoom = 15, interactive = true }: Props) {
    const { resolvedTheme } = useTheme();

    return (
        <GoogleMapsProvider>
            <GoogleMap
                defaultCenter={{ lat, lng }}
                defaultZoom={zoom}
                disableDefaultUI
                gestureHandling={interactive ? "greedy" : "none"}
                colorScheme={resolvedTheme === "dark" ? ColorScheme.DARK : ColorScheme.LIGHT}
                className="h-full w-full"
            >
                {onMove && <MoveListener onMove={onMove} />}
                {flyTo && <FlyTo position={flyTo} />}
            </GoogleMap>
        </GoogleMapsProvider>
    );
}
