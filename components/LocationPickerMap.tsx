"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { MapContainer, TileLayer, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MoveListener({ onMove }: { onMove: (lat: number, lng: number) => void }) {
    const map = useMapEvents({
        moveend: () => {
            const c = map.getCenter();
            onMove(c.lat, c.lng);
        },
    });
    return null;
}

function FlyTo({ position }: { position: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(position, map.getZoom(), { animate: true, duration: 0.8 });
    }, [position, map]); // eslint-disable-line
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
    const tileUrl = resolvedTheme === "dark"
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

    return (
        <MapContainer
            center={[lat, lng]}
            zoom={zoom}
            className="h-full w-full"
            zoomControl={false}
            dragging={interactive}
            scrollWheelZoom={interactive}
            doubleClickZoom={interactive}
            touchZoom={interactive}
        >
            <TileLayer key={resolvedTheme} url={tileUrl} attribution="&copy; CARTO" />
            {onMove && <MoveListener onMove={onMove} />}
            {flyTo && <FlyTo position={flyTo} />}
        </MapContainer>
    );
}
