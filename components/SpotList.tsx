"use client";

import SpotCard from "./SpotCard";
import { Icon } from "@/components/Icon";

interface SpotListProps {
  spots: any[];
  onSpotClick: (spot: any) => void;
}

export default function SpotList({ spots, onSpotClick }: SpotListProps) {
  if (spots.length === 0) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: "100%", padding: 32, textAlign: "center",
        gap: 12, color: "var(--muted)",
      }}>
        <Icon name="map" size={40} style={{ color: "var(--border-strong)" }} />
        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-2)", margin: 0 }}>
          No hay sitios visibles
        </p>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
          Mueve el mapa para encontrar más lugares.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 14,
      padding: "16px 16px 88px",
    }}>
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
