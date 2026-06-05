"use client";

import { Icon } from "@/components/Icon";
import FavoriteButton from "./FavoriteButton";
import { getPlaceType, getSpotStatus, getServiceIcon, coverPhoto } from "@/lib/placeTypes";

const PERNOCTAR_CATS = new Set(["NATURE", "AC_FREE", "AC_PAID", "PARKING_DN", "CAMPING"]);

interface SpotCardProps {
  spot: any;
  onClick: () => void;
}

export default function SpotCard({ spot, onClick }: SpotCardProps) {
  const type = getPlaceType(spot.category);
  const status = getSpotStatus(spot.category);
  const photo = coverPhoto(spot.images);
  const aptaPernoctar = PERNOCTAR_CATS.has(spot.category);
  const services: any[] = spot.services ?? [];
  const visibleServices = services.slice(0, 5);
  const extraServices = services.length - visibleServices.length;

  return (
    <div className="placecard" onClick={onClick}>
      {/* ── Image ── */}
      <div style={{ position: "relative", height: 160, overflow: "hidden", background: "var(--surface-2)" }}>
        <img
          src={photo}
          alt={spot.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />

        {/* Chips top-left: tipo + pernocta */}
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
          <div className="chip-glass">
            <div style={{
              width: 20, height: 20, borderRadius: 99, flexShrink: 0,
              background: type.color, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name={type.icon} size={12} style={{ color: "#fff" }} strokeWidth={2.2} />
            </div>
            <span>{type.short}</span>
          </div>
          {aptaPernoctar && (
            <div className="chip-glass">
              <Icon name="moon" size={12} style={{ color: "#3D5A98" }} filled />
              <span style={{ color: "#3D5A98" }}>Pernocta</span>
            </div>
          )}
        </div>

        {/* Favorite button (top-right) */}
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <FavoriteButton spotId={spot.id} initialIsFavorite={spot.isFavorite} />
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "12px 14px 14px" }}>

        {/* Name + price */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
          <h3 className="place-name" style={{ flex: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {spot.title}
          </h3>
          <span style={{
            fontSize: 13.5, fontWeight: 700, flexShrink: 0, paddingTop: 2,
            color: spot.isFree ? "var(--success)" : "var(--text-2)",
          }}>
            {spot.isFree ? "Gratis" : "De pago"}
          </span>
        </div>

        {/* Metadata row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          {(spot.rating ?? 0) > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Icon name="star" size={13} filled style={{ color: "var(--warning)" }} />
              <span className="meta-text">{spot.rating}</span>
            </div>
          )}
          {typeof spot._distanceKm === "number" && (
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Icon name="navigate" size={13} style={{ color: "var(--muted)" }} />
              <span className="meta-text">
                {spot._distanceKm < 1
                  ? `${Math.round(spot._distanceKm * 1000)} m`
                  : `${spot._distanceKm.toFixed(1)} km`}
              </span>
            </div>
          )}
          {(spot.places ?? 0) > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Icon name="car" size={13} style={{ color: "var(--muted)" }} />
              <span className="meta-text">{spot.places}{spot.places >= 5 ? "+" : ""}</span>
            </div>
          )}

          {/* Status badge */}
          <div style={{ marginLeft: "auto" }}>
            {status === "verificado" ? (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                padding: "3px 8px", borderRadius: 99, fontSize: 11, fontWeight: 800,
                background: "var(--success-soft)", color: "var(--success)",
              }}>
                <Icon name="check" size={10} />
                Verificado
              </span>
            ) : (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                padding: "3px 8px", borderRadius: 99, fontSize: 11, fontWeight: 800,
                background: "#FFF0EB", color: "#E2562A",
              }}>
                <Icon name="questionMark" size={10} />
                Candidato
              </span>
            )}
          </div>
        </div>

        {/* Service icons */}
        {services.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {visibleServices.map((s: any) => (
              <div
                key={s.service?.name ?? s.id}
                title={s.service?.name}
                style={{
                  width: 28, height: 28, borderRadius: 99,
                  background: "var(--surface-2)", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--muted)",
                }}
              >
                <Icon name={getServiceIcon(s.service?.name ?? "")} size={14} />
              </div>
            ))}
            {extraServices > 0 && (
              <span className="meta-text">+{extraServices}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
