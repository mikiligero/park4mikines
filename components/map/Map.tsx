/* eslint-disable */
"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Icon } from "@/components/Icon";
import AddSpotWizard from "../AddSpotWizard";
import SpotList from "../SpotList";
import SpotDetail from "../SpotDetail";
import { getPlaceType } from "@/lib/placeTypes";

// ── Marker icon SVG paths (plain HTML strings for Leaflet divIcon) ────────────
const MARKER_SVG: Record<string, string> = {
  NATURE:      `<g><path d="M12 3 6.5 11h3.2l-4 5.5h12.6l-4-5.5h3.2L12 3Z"/><path d="M12 16.5V21"/></g>`,
  AC_FREE:     `<g><path d="M2.5 16V8.6A1.6 1.6 0 0 1 4.1 7H13l5.4 4.6h1.1A1.4 1.4 0 0 1 21 13v3"/><path d="M2.5 16h2.3M9.3 16h5M19 16h2"/><circle cx="7" cy="16.5" r="2.2"/><circle cx="16.8" cy="16.5" r="2.2"/><rect x="4.6" y="9.4" width="3.4" height="2.8" rx="0.6"/></g>`,
  AC_PAID:     `<g><path d="M2.5 16V8.6A1.6 1.6 0 0 1 4.1 7H13l5.4 4.6h1.1A1.4 1.4 0 0 1 21 13v3"/><path d="M2.5 16h2.3M9.3 16h5M19 16h2"/><circle cx="7" cy="16.5" r="2.2"/><circle cx="16.8" cy="16.5" r="2.2"/><rect x="4.6" y="9.4" width="3.4" height="2.8" rx="0.6"/></g>`,
  PARKING_DN:  `<g><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M9 17.5V6.5h4a2.6 2.6 0 0 1 0 5.2H9"/></g>`,
  PARKING_DAY: `<g><path d="M7 20V4h5a4 4 0 0 1 0 8H7"/><circle cx="18" cy="6.5" r="2.3"/><path d="M18 1.9v1.2M18 9.7v1.2M22.4 6.5h-1.2M15.8 6.5h-1.2M21.1 3.4l-.85.85M15.75 8.75l-.85.85M21.1 9.6l-.85-.85M15.75 4.25l-.85-.85"/></g>`,
  REST_AREA:   `<g><path d="M7.5 21 9.7 4M16.5 21 14.3 4"/><path d="M12 6v2.4M12 10.8v2.4M12 15.6V18"/></g>`,
  PICNIC:      `<g><path d="M3 9.5h18M5.5 9.5 3.5 20.5M18.5 9.5l2 11M8.5 9.5 7.5 20.5M15.5 9.5l1 11M6 15h12"/></g>`,
  CAMPING:     `<g><path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 4v16M12 20l6-10"/></g>`,
  SERVICE:     `<g><path d="M12 2.5s2.2 2.7 2.2 4.3a2.2 2.2 0 0 1-4.4 0c0-1.6 2.2-4.3 2.2-4.3Z"/><rect x="3.5" y="10" width="17" height="9.5" rx="1.6"/><path d="M8 10v9.5M12 10v9.5M16 10v9.5"/></g>`,
  OFFROAD:     `<g><path d="M2.5 15.5V10l4-1L9.5 5.5h5L17.5 9l4 1v5.5"/><path d="M2.5 13h19"/><circle cx="7.5" cy="16.8" r="2.4"/><circle cx="16.5" cy="16.8" r="2.4"/></g>`,
  CANDIDATO:   `<g><path d="M8.6 8.6a3.4 3.4 0 1 1 4.8 3.1c-1 .5-1.4 1.1-1.4 2.5"/><circle cx="12" cy="18.3" r="1.25" fill="white" stroke="none"/></g>`,
  PERNOCTA:    `<path d="M20 13a8 8 0 1 1-9-9 6.5 6.5 0 0 0 9 9Z" fill="white"/>`,
};

function markerHtml(category: string, selected = false, isFavorite = false): string {
  const type = getPlaceType(category);
  const size = selected ? 46 : 38;
  const border = selected ? 4 : 3;
  const iconSize = selected ? 22 : 18;
  const triBase = selected ? 8 : 6;
  const triHeight = selected ? 10 : 8;
  const svg = MARKER_SVG[category] ?? MARKER_SVG.NATURE;

  return `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center">
      <div style="
        width:${size}px;height:${size}px;background:${type.color};
        border-radius:50%;border:${border}px solid white;
        box-shadow:0 2px 10px rgba(0,0,0,0.28);
        display:flex;align-items:center;justify-content:center;
      ">
        <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24"
          fill="none" stroke="white" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          ${svg}
        </svg>
      </div>
      <div style="
        width:0;height:0;
        border-left:${triBase}px solid transparent;
        border-right:${triBase}px solid transparent;
        border-top:${triHeight}px solid ${type.color};
        margin-top:-2px;
      "></div>
      ${isFavorite ? `
        <div style="
          position:absolute;top:-2px;right:-2px;
          width:14px;height:14px;background:#E5484D;
          border-radius:50%;border:2px solid white;
          display:flex;align-items:center;justify-content:center;
        ">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M12 20s-7-4.5-9.5-9A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9.5 5c-2.5 4.5-9.5 9-9.5 9Z"/>
          </svg>
        </div>` : ''}
    </div>
  `;
}

function pernoctaMarkerHtml(): string {
  return `
    <div style="display:flex;flex-direction:column;align-items:center">
      <div style="
        width:32px;height:32px;background:#4F46E5;
        border-radius:50%;border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
        display:flex;align-items:center;justify-content:center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${MARKER_SVG.PERNOCTA}
        </svg>
      </div>
      <div style="
        width:0;height:0;
        border-left:5px solid transparent;border-right:5px solid transparent;
        border-top:7px solid #4F46E5;margin-top:-2px;
      "></div>
    </div>
  `;
}

const createSpotIcon = (category: string, selected = false, isFavorite = false) =>
  L.divIcon({
    className: "",
    html: markerHtml(category, selected, isFavorite),
    iconSize:   selected ? [46, 56] : [38, 46],
    iconAnchor: selected ? [23, 56] : [19, 46],
    popupAnchor: [0, -50],
  });

const createPernoctaIcon = () =>
  L.divIcon({
    className: "",
    html: pernoctaMarkerHtml(),
    iconSize: [32, 39],
    iconAnchor: [16, 39],
    popupAnchor: [0, -42],
  });

// ── User location dot ─────────────────────────────────────────────────────────
function LocationMarker({ position }: { position: [number, number] | null }) {
  if (!position) return null;
  return (
    <Marker
      position={position}
      zIndexOffset={1000}
      icon={L.divIcon({
        className: "",
        html: `
          <div style="
            width:18px;height:18px;background:#2B7FE0;
            border-radius:50%;border:3px solid white;
            box-shadow:0 0 0 6px rgba(43,127,224,0.25);
          "></div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      })}
    >
      <Popup>Estás aquí</Popup>
    </Marker>
  );
}

// ── Map event listener ────────────────────────────────────────────────────────
function MapEvents({ setBounds }: { setBounds: (b: L.LatLngBounds) => void }) {
  const map = useMap();
  useEffect(() => { if (map) setBounds(map.getBounds()); }, [map, setBounds]);
  useMapEvents({
    moveend: () => setBounds(map.getBounds()),
    zoomend: () => setBounds(map.getBounds()),
  });
  return null;
}

// ── Fly-to controller ─────────────────────────────────────────────────────────
function MapController({ center, zoom }: { center: [number, number] | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

// ── Custom zoom buttons ───────────────────────────────────────────────────────
function ZoomControls() {
  const map = useMap();
  const btnStyle: React.CSSProperties = {
    width: 40, height: 40, background: "var(--surface)",
    border: "1px solid var(--border)", borderRadius: 12,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", color: "var(--text-2)",
    boxShadow: "var(--shadow-sm)",
    fontSize: 20, fontWeight: 700, lineHeight: 1,
    transition: "background .15s",
  };
  return (
    <div style={{
      position: "absolute", bottom: 100, right: 16, zIndex: 900,
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <button style={btnStyle} onClick={() => map.zoomIn()}  title="Acercar">+</button>
      <button style={btnStyle} onClick={() => map.zoomOut()} title="Alejar">−</button>
    </div>
  );
}

// ── Distance helpers ─────────────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function fmtDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// ── Map click (closes peek card) ─────────────────────────────────────────────
function MapClickHandler({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({ click: onMapClick });
  return null;
}

// ── Peek card ─────────────────────────────────────────────────────────────────
function PeekCard({ spot, onClose, onOpenDetail }: {
  spot: any;
  onClose: () => void;
  onOpenDetail: () => void;
}) {
  const type = getPlaceType(spot.category);
  const photo = spot.images?.[0]?.url ?? "/default-place.png";
  const dist  = typeof spot._distanceKm === "number" ? fmtDist(spot._distanceKm) : null;

  return (
    <div
      style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1200,
        background: "var(--surface)", borderRadius: "20px 20px 0 0",
        boxShadow: "var(--shadow-lg)", padding: "8px 16px 28px",
        animation: "slideUp .22s ease",
      }}
    >
      {/* Drag handle */}
      <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--border-strong)", margin: "0 auto 12px" }} />

      {/* Content row */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
        {/* Photo */}
        <div style={{
          width: 84, height: 84, borderRadius: 14, overflow: "hidden",
          flexShrink: 0, background: "var(--surface-2)",
        }}>
          <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em",
            color: "var(--text)", marginBottom: 5,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {spot.title}
          </h3>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            <div className="chip-glass" style={{ padding: "0 8px 0 4px", height: 22 }}>
              <div style={{
                width: 14, height: 14, borderRadius: 99, background: type.color,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon name={type.icon} size={9} style={{ color: "#fff" }} strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: 11 }}>{type.short}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: spot.isFree ? "var(--success)" : "var(--text-2)" }}>
              {spot.isFree ? "Gratis" : "De pago"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {(spot.rating ?? 0) > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Icon name="star" size={12} filled style={{ color: "var(--warning)" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>{spot.rating}</span>
              </div>
            )}
            {dist && (
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Icon name="navigate" size={12} style={{ color: "var(--muted)" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>{dist}</span>
              </div>
            )}
          </div>
        </div>

        {/* Close */}
        <button className="iconbtn iconbtn-ghost" style={{ width: 30, height: 30, flexShrink: 0 }} onClick={onClose}>
          <Icon name="close" size={16} />
        </button>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-md"
          style={{ flex: 1, textDecoration: "none" }}
          onClick={e => e.stopPropagation()}
        >
          <Icon name="navigate" size={16} />
          Cómo llegar
        </a>
        <button className="btn btn-primary btn-md" style={{ flex: 1 }} onClick={onOpenDetail}>
          <Icon name="info" size={16} />
          Ver ficha
        </button>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function Map({ spots, pernoctas = [] }: { spots: any[]; pernoctas?: any[] }) {
  return (
    <Suspense fallback={null}>
      <MapContent spots={spots} pernoctas={pernoctas} />
    </Suspense>
  );
}

function MapContent({ spots, pernoctas = [] }: { spots: any[]; pernoctas?: any[] }) {
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();

  const [showFilters, setShowFilters]               = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedServices, setSelectedServices]     = useState<string[]>([]);
  const [minRating, setMinRating]                   = useState(0);
  const [showFavoritesOnly, setShowFavoritesOnly]   = useState(false);
  const [aptosPernoctar, setAptosPernoctar]         = useState(false);
  const [soloGratuitos, setSoloGratuitos]           = useState(false);
  const [showPernoctas, setShowPernoctas]           = useState(false);
  const [showSpots, setShowSpots]                   = useState(true);
  const [initialPosition, setInitialPosition]       = useState<[number, number] | null>(null);
  const [zoom, setZoom]                             = useState(14);
  const [selectedSpot, setSelectedSpot]             = useState<any | null>(null);
  const [peekSpot, setPeekSpot]                     = useState<any | null>(null);
  const [editingSpot, setEditingSpot]               = useState<any | null>(null);
  const [searchQuery, setSearchQuery]               = useState("");
  const [searchResults, setSearchResults]           = useState<any[]>([]);
  const [isSearching, setIsSearching]               = useState(false);
  const [showSearchResults, setShowSearchResults]   = useState(false);
  const [isLocating, setIsLocating]                 = useState(false);
  const [userPosition, setUserPosition]             = useState<[number, number] | null>(null);
  const [listFilter, setListFilter]                 = useState("");
  const [viewMode, setViewMode]                     = useState<"map" | "list">("map");
  const [bounds, setBounds]                         = useState<L.LatLngBounds | null>(null);

  const ignoreSearchRef = useRef(false);

  // Query-param driven view
  useEffect(() => {
    if (searchParams.get("pernoctas") === "true") {
      setShowPernoctas(true);
      setShowSpots(false);
      setInitialPosition([40.0, -3.7]);
      setZoom(6);
    } else {
      setShowSpots(true);
      setShowPernoctas(false);
      setZoom(prev => prev === 6 ? 14 : prev);
    }
  }, [searchParams]);

  // Geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const pos: [number, number] = [coords.latitude, coords.longitude];
          setInitialPosition(pos);
          setUserPosition(pos);
        },
        () => setInitialPosition([40.416775, -3.70379]),
        { timeout: 5000 }
      );
    } else {
      setInitialPosition([40.416775, -3.70379]);
    }
  }, []);

  // Debounced geocode search
  useEffect(() => {
    const id = setTimeout(async () => {
      if (ignoreSearchRef.current) { ignoreSearchRef.current = false; return; }
      if (searchQuery.trim().length > 2) {
        setIsSearching(true);
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
          const data = await res.json();
          setSearchResults(data);
          setShowSearchResults(true);
        } catch {}
        finally { setIsSearching(false); }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 500);
    return () => clearTimeout(id);
  }, [searchQuery]);

  const handleSelectLocation = (lat: string, lon: string, displayName: string) => {
    const latN = parseFloat(lat), lonN = parseFloat(lon);
    if (!isNaN(latN) && !isNaN(lonN)) {
      ignoreSearchRef.current = true;
      setInitialPosition([latN, lonN]);
      setSearchQuery(displayName.split(",")[0]);
      setShowSearchResults(false);
      setSearchResults([]);
    }
  };

  const handleLocateMe = () => {
    setIsLocating(true);
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        setInitialPosition([coords.latitude, coords.longitude]);
        setUserPosition([coords.latitude, coords.longitude]);
        setIsLocating(false);
      },
      () => { setIsLocating(false); alert("No se pudo obtener tu ubicación."); },
      { timeout: 5000, enableHighAccuracy: true }
    );
  };

  const toggleFilter = (list: string[], item: string, setList: (l: string[]) => void) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const PERNOCTAR_CATS = new Set(["NATURE", "AC_FREE", "AC_PAID", "PARKING_DN", "CAMPING"]);

  const filteredSpots = spots
    .filter(spot => {
      if (!showSpots) return false;
      if (showFavoritesOnly && !spot.isFavorite) return false;
      if (aptosPernoctar && !PERNOCTAR_CATS.has(spot.category)) return false;
      if (soloGratuitos && !spot.isFree) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(spot.category)) return false;
      if (minRating > 0 && (spot.rating || 0) < minRating) return false;
      if (selectedServices.length > 0) {
        const names = spot.services?.map((s: any) => s.service.name) || [];
        if (!selectedServices.every(s => names.includes(s))) return false;
      }
      return true;
    })
    .map(spot => ({
      ...spot,
      _distanceKm: userPosition
        ? haversineKm(userPosition[0], userPosition[1], spot.latitude, spot.longitude)
        : undefined,
    }));

  const visibleSpots = filteredSpots
    .filter(spot => !bounds || bounds.contains([spot.latitude, spot.longitude]))
    .sort((a, b) => ((a._distanceKm ?? Infinity) - (b._distanceKm ?? Infinity)));

  const listSpots = listFilter.trim()
    ? visibleSpots.filter(s => s.title.toLowerCase().includes(listFilter.toLowerCase()))
    : visibleSpots;

  const activeFilterCount =
    selectedCategories.length + selectedServices.length +
    (showFavoritesOnly ? 1 : 0) + (minRating > 0 ? 1 : 0) +
    (aptosPernoctar ? 1 : 0) + (soloGratuitos ? 1 : 0);

  // Tile URL switches with theme
  const tileUrl = resolvedTheme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  const categories = [
    "NATURE", "PARKING_DN", "REST_AREA", "PICNIC",
    "AC_FREE", "AC_PAID", "OFFROAD", "CAMPING", "SERVICE", "PARKING_DAY", "CANDIDATO",
  ];
  const servicesList = [
    { id: "water",      label: "Agua potable" },
    { id: "blackwater", label: "Aguas negras" },
    { id: "greywater",  label: "Aguas grises" },
    { id: "trash",      label: "Cubo de basura" },
    { id: "toilets",    label: "Baños públicos" },
    { id: "showers",    label: "Duchas" },
    { id: "electricity",label: "Electricidad" },
    { id: "wifi",       label: "WIFI" },
    { id: "pool",       label: "Piscina" },
    { id: "laundry",    label: "Lavandería" },
    { id: "carwash",    label: "Lavado de autocaravanas" },
    { id: "bakery",     label: "Panadería" },
    { id: "5g",         label: "Cobertura 5G" },
  ];

  if (!initialPosition) {
    return (
      <div style={{ height: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, background: "var(--bg)" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--primary)", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "var(--muted)", fontSize: 14, fontWeight: 600 }}>Obteniendo ubicación…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Buscador reutilizable (render fn, no component) ──────────────────────
  const renderSearchInput = (width: number) => (
    <div style={{ position: "relative", zIndex: 1600, width: width || undefined, flex: width ? undefined : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", padding: "0 12px", height: 42 }}>
        <Icon name="search" size={16} style={{ color: "var(--faint)", flexShrink: 0 }} />
        <input
          type="text" placeholder="Buscar lugar o ciudad…"
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14, color: "var(--text)", fontFamily: "var(--font)", minWidth: 0 }}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => { if (searchResults.length > 0) setShowSearchResults(true); }}
          onKeyDown={e => { if (e.key === "Enter" && searchResults.length > 0) { const r = searchResults[0]; handleSelectLocation(r.lat, r.lon, r.display_name); } }}
        />
        {isSearching && <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--primary)", animation: "spin .7s linear infinite", flexShrink: 0 }} />}
      </div>
      {showSearchResults && searchResults.length > 0 && (
        <div style={{ position: "absolute", top: 48, left: 0, right: 0, background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", boxShadow: "var(--shadow-md)", overflow: "hidden", zIndex: 3000 }}>
          {searchResults.map((r: any, i: number) => (
            <button key={i} style={{ width: "100%", textAlign: "left", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text)", background: "transparent", border: "none", borderBottom: i < searchResults.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer", fontFamily: "var(--font)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              onClick={() => handleSelectLocation(r.lat, r.lon, r.display_name)}
            >
              <Icon name="pin" size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );


  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden", position: "relative" }}>

      {/* ══ ESCRITORIO: columna izquierda (404px) ══════════════════════════ */}
      <div className="deskcol" style={{ flexDirection: "column", height: "100%", flexShrink: 0 }}>
        {/* Encabezado */}
        <div style={{ padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", flexShrink: 0, background: "var(--surface)" }}>
          <h1 className="screen-title" style={{ fontSize: 20 }}>Explorar</h1>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={handleLocateMe} className="iconbtn iconbtn-ghost" style={{ width: 36, height: 36, color: isLocating ? "var(--primary)" : "var(--muted)" }} title="Mi ubicación">
              <Icon name="gps" size={18} style={{ animation: isLocating ? "spin .8s linear infinite" : "none" }} />
            </button>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowFilters(true)} className="iconbtn iconbtn-ghost" style={{ width: 36, height: 36, color: activeFilterCount > 0 ? "var(--primary)" : "var(--muted)" }} title="Filtros">
                <Icon name="sliders" size={18} />
              </button>
              {activeFilterCount > 0 && <span className="badge">{activeFilterCount}</span>}
            </div>
          </div>
        </div>

        {/* Buscador geocodificación */}
        <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0, background: "var(--surface)" }}>
          {renderSearchInput(372)}
        </div>

        {/* Filtro por nombre */}
        <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0, background: "var(--surface)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface-2)", borderRadius: 10, padding: "6px 10px" }}>
            <Icon name="filter" size={13} style={{ color: "var(--faint)", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Filtrar por nombre…"
              value={listFilter}
              onChange={e => setListFilter(e.target.value)}
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, color: "var(--text)", fontFamily: "var(--font)" }}
            />
            {listFilter && (
              <button onClick={() => setListFilter("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0, color: "var(--muted)" }}>
                <Icon name="close" size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Contador */}
        <div style={{ padding: "8px 20px 4px", fontSize: 13, fontWeight: 600, color: "var(--muted)", flexShrink: 0, background: "var(--surface)" }}>
          {listSpots.length} lugar{listSpots.length !== 1 ? "es" : ""}
          {listFilter && visibleSpots.length !== listSpots.length && (
            <span style={{ color: "var(--faint)", fontWeight: 400 }}> de {visibleSpots.length}</span>
          )}
        </div>

        {/* Lista de lugares */}
        <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
          <SpotList spots={listSpots} onSpotClick={s => setSelectedSpot(s)} />
        </div>
      </div>

      {/* ══ Área del mapa (flex-1 en escritorio, pantalla completa en móvil) ══ */}
      <div style={{ flex: 1, position: "relative", height: "100%", minWidth: 0 }}>
        <MapContainer center={initialPosition} zoom={zoom} scrollWheelZoom zoomControl={false} className="h-full w-full">
          <MapEvents setBounds={setBounds} />
          <MapController center={initialPosition} zoom={zoom} />
          <MapClickHandler onMapClick={() => setPeekSpot(null)} />
          <ZoomControls />
          <TileLayer key={resolvedTheme} attribution='&copy; <a href="https://carto.com/">CARTO</a>' url={tileUrl} />
          <LocationMarker position={userPosition} />
          {filteredSpots.map(spot => (
            <Marker key={spot.id} position={[spot.latitude, spot.longitude]}
              icon={createSpotIcon(spot.category, peekSpot?.id === spot.id || selectedSpot?.id === spot.id, spot.isFavorite)}
              eventHandlers={{ click: () => { setPeekSpot(spot); setSelectedSpot(null); } }}
            />
          ))}
          {showPernoctas && pernoctas.map(p => (
            <Marker key={`p-${p.id}`} position={[p.latitude, p.longitude]} icon={createPernoctaIcon()}>
              <Popup>
                <div style={{ fontFamily: "var(--font)", padding: 2 }}>
                  <div style={{ fontWeight: 700, color: "var(--primary)", marginBottom: 2 }}>Pernocta</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(p.date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</div>
                  {p.locationName && <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{p.locationName}</div>}
                  {p.notes && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, fontStyle: "italic" }}>"{p.notes}"</div>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Peek card (ambas vistas) */}
        {peekSpot && !selectedSpot && (
          <PeekCard spot={peekSpot} onClose={() => setPeekSpot(null)}
            onOpenDetail={() => { setSelectedSpot(peekSpot); setPeekSpot(null); }} />
        )}

        {/* MÓVIL: lista como overlay */}
        {viewMode === "list" && (
          <div className="map-mobile-only" style={{ position: "absolute", inset: 0, zIndex: 500, background: "var(--bg)", paddingTop: 90 }}>
            <SpotList spots={visibleSpots} onSpotClick={s => setSelectedSpot(s)} />
          </div>
        )}

        {/* MÓVIL: barra superior fija (oculta en escritorio) */}
        <div className="map-mobile-only" style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 1500,
          background: "var(--surface)", borderBottom: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}>
          {/* Fila 1: ← búsqueda ⊞ */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
            <a href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
              <button className="iconbtn iconbtn-ghost" style={{ width: 38, height: 38 }}>
                <Icon name="back" size={20} />
              </button>
            </a>
            {renderSearchInput(0)}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button onClick={() => setShowFilters(true)} className="iconbtn iconbtn-surface"
                style={{ width: 38, height: 38, color: activeFilterCount > 0 ? "var(--primary)" : "var(--text-2)" }}>
                <Icon name="sliders" size={17} />
              </button>
              {activeFilterCount > 0 && <span className="badge">{activeFilterCount}</span>}
            </div>
          </div>
          {/* Fila 2: toggle Mapa / Lista centrado */}
          <div style={{ display: "flex", justifyContent: "center", paddingBottom: 8 }}>
            <div className="viewtoggle" style={{ padding: 3 }}>
              <button className={viewMode === "map" ? "is-on" : ""} onClick={() => setViewMode("map")} style={{ padding: "6px 14px", gap: 5 }}>
                <Icon name="map" size={14} />Mapa
              </button>
              <button className={viewMode === "list" ? "is-on" : ""} onClick={() => setViewMode("list")} style={{ padding: "6px 14px", gap: 5 }}>
                <Icon name="list" size={14} />Lista
              </button>
            </div>
          </div>
        </div>
        {/* Espaciador para que el mapa no quede tapado por la barra fija en móvil */}
        <div className="map-mobile-only" style={{ height: 90 }} />
      </div>

      {/* ══ Overlays compartidos ═══════════════════════════════════════════ */}

      {/* Detalle de lugar */}
      {selectedSpot && (
        <SpotDetail spot={selectedSpot} onClose={() => setSelectedSpot(null)}
          onEdit={s => { setEditingSpot(s); setSelectedSpot(null); }} />
      )}

      {/* Editar lugar */}
      {editingSpot && (
        <AddSpotWizard spot={editingSpot} onCancel={() => { setEditingSpot(null); window.location.reload(); }} />
      )}

      {/* ── Panel de filtros ── */}
      {showFilters && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 5000,
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowFilters(false); }}
        >
          <div style={{
            background: "var(--surface)", width: "100%", maxWidth: 480,
            borderRadius: "26px 26px 0 0", maxHeight: "85vh",
            display: "flex", flexDirection: "column", overflow: "hidden",
            boxShadow: "var(--shadow-lg)",
          }}>
            {/* Cabecera */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px 12px", borderBottom: "1px solid var(--border)",
            }}>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>
                Filtros
              </span>
              <button className="iconbtn iconbtn-ghost" style={{ width: 36, height: 36 }} onClick={() => setShowFilters(false)}>
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* Contenido */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Preferencias rápidas */}
              <div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {[
                    { id: "fav", label: "Solo favoritos",       icon: "heart" as const, active: showFavoritesOnly, toggle: () => setShowFavoritesOnly(v => !v) },
                    { id: "per", label: "Aptos para pernoctar", icon: "moon"  as const, active: aptosPernoctar,    toggle: () => setAptosPernoctar(v => !v) },
                    { id: "gra", label: "Solo gratuitos",       icon: "euro"  as const, active: soloGratuitos,     toggle: () => setSoloGratuitos(v => !v) },
                  ].map(row => (
                    <label key={row.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 12px", borderRadius: 12, cursor: "pointer",
                      background: row.active ? "var(--primary-soft)" : "transparent",
                      transition: "background .15s",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Icon name={row.icon} size={18} filled={row.active} style={{ color: row.active ? "var(--primary)" : "var(--muted)" }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{row.label}</span>
                      </div>
                      <div
                        className={`cbox ${row.active ? "is-on" : ""}`}
                        onClick={e => { e.preventDefault(); row.toggle(); }}
                      >
                        {row.active && <Icon name="check" size={13} />}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Valoración mínima */}
              <div>
                <p className="label" style={{ marginBottom: 12 }}>Valoración mínima</p>
                <div style={{ display: "flex", gap: 6 }}>
                  {[0, 1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setMinRating(n)}
                      style={{
                        flex: 1, height: 38, borderRadius: 99,
                        fontWeight: 700, fontSize: 13,
                        border: "none", cursor: "pointer",
                        background: minRating === n ? "var(--primary)" : "var(--surface-2)",
                        color: minRating === n ? "var(--on-primary)" : "var(--muted)",
                        transition: "background .15s, color .15s",
                      }}
                    >
                      {n === 0 ? "Todo" : `${n}★`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipos de lugar */}
              <div>
                <p className="label" style={{ marginBottom: 12 }}>Tipo de lugar</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {categories.map(cat => {
                    const type = getPlaceType(cat);
                    const active = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        className={`type-chip ${active ? "is-on" : ""}`}
                        style={{ "--tc": type.color } as any}
                        onClick={() => toggleFilter(selectedCategories, cat, setSelectedCategories)}
                      >
                        <div style={{
                          width: 22, height: 22, borderRadius: 99,
                          background: active ? type.color : "var(--border)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, transition: "background .15s",
                        }}>
                          <Icon name={type.icon} size={12} style={{ color: active ? "#fff" : "var(--muted)" }} />
                        </div>
                        {type.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Servicios */}
              <div>
                <p className="label" style={{ marginBottom: 12 }}>Servicios</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {servicesList.map(srv => {
                    const active = selectedServices.includes(srv.label);
                    return (
                      <button
                        key={srv.id}
                        className={`svc-chip ${active ? "is-on" : ""}`}
                        onClick={() => toggleFilter(selectedServices, srv.label, setSelectedServices)}
                      >
                        {srv.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pie */}
            <div style={{
              padding: "12px 20px 24px",
              borderTop: "1px solid var(--border)",
              display: "flex", gap: 10,
            }}>
              <button
                className="btn btn-ghost btn-md"
                style={{ flex: 1 }}
                onClick={() => {
                  setSelectedCategories([]);
                  setSelectedServices([]);
                  setMinRating(0);
                  setShowFavoritesOnly(false);
                  setAptosPernoctar(false);
                  setSoloGratuitos(false);
                }}
              >
                Limpiar
              </button>
              <button
                className="btn btn-primary btn-md"
                style={{ flex: 2 }}
                onClick={() => setShowFilters(false)}
              >
                Ver resultados ({visibleSpots.length})
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .leaflet-container { background: var(--bg); }
      `}</style>
    </div>
  );
}
