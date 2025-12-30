/* eslint-disable */
"use client";

import SpotCard from "./SpotCard";

interface SpotListProps {
    spots: any[];
    onSpotClick: (spot: any) => void;
}

export default function SpotList({ spots, onSpotClick }: SpotListProps) {
    if (spots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
                <p className="text-lg font-medium mb-2">No hay sitios visibles</p>
                <p className="text-sm">Mueve el mapa para encontrar más lugares.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 pb-24 overflow-y-auto h-full bg-gray-50/50">
            {spots.map((spot) => (
                <SpotCard
                    key={spot.id}
                    spot={spot}
                    onClick={() => onSpotClick(spot)}
                />
            ))}
        </div>
    );
}
