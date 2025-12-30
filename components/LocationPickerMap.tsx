"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapEvents({ onPositionChange }: { onPositionChange: (pos: { lat: number; lng: number }) => void }) {
    const map = useMapEvents({
        moveend: () => {
            const center = map.getCenter();
            onPositionChange({ lat: center.lat, lng: center.lng });
        },
    });

    // Removed auto-locate useEffect because parent handles initial position now

    return null;
}

// Helper to update map center when position prop changes
function MapUpdater({ position }: { position: number[] }) {
    const map = useMapEvents({});

    useEffect(() => {
        if (position) {
            map.flyTo([position[0], position[1]], map.getZoom(), {
                animate: true,
                duration: 1.5 // Smooth animation
            });
        }
    }, [position, map]);

    return null;
}

export default function LocationPickerMap({ initialPosition, onPositionChange }: { initialPosition: number[], onPositionChange: (pos: { lat: number; lng: number }) => void }) {
    return (
        <MapContainer center={[initialPosition[0], initialPosition[1]]} zoom={15} className="h-full w-full">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEvents onPositionChange={onPositionChange} />
            <MapUpdater position={initialPosition} />
        </MapContainer>
    );
}
