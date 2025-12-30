/* eslint-disable */
"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Filter, X, Search, Star, MapPin, Crosshair, Heart, List, Map as MapIcon } from "lucide-react";
import FavoriteButton from "../FavoriteButton";
import AddSpotWizard from "../AddSpotWizard";
import SpotList from "../SpotList";

// --- Icon Paths for Markers ---
import { IconPaths, getCategoryStyles } from "@/lib/categories";

const createCustomIcon = (category: string) => {
    const style = getCategoryStyles(category);

    return L.divIcon({
        className: "custom-map-marker",
        html: `
            <div class="relative group">
                <div class="w-10 h-10 select-none transform transition-transform group-hover:scale-110">
                    <img src="${style.img}" alt="${style.label}" class="w-full h-full drop-shadow-md" />
                </div>
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20], // Center of the circle
        popupAnchor: [0, -20],
    });
};

function LocationMarker({ position }: { position: [number, number] | null }) {
    if (!position) return null;

    return (
        <Marker
            position={position}
            zIndexOffset={1000}
            icon={L.divIcon({
                className: "current-location-marker",
                html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md">
                        <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                       </div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            })}
        >
            <Popup>Estás aquí</Popup>
        </Marker>
    );
}

// Inner component to track map bounds
function MapEvents({ setBounds }: { setBounds: (bounds: L.LatLngBounds) => void }) {
    const map = useMap();

    useEffect(() => {
        if (map) {
            setBounds(map.getBounds());
        }
    }, [map, setBounds]);

    useMapEvents({
        moveend: () => setBounds(map.getBounds()),
        zoomend: () => setBounds(map.getBounds()),
    });
    return null;
}

import SpotDetail from "../SpotDetail"; // Ensure path is correct

// Inner component to control map movement from outside
function MapController({ center }: { center: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 12, { animate: true });
        }
    }, [center, map]);
    return null;
}

export default function Map({ spots }: { spots: any[] }) {
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [minRating, setMinRating] = useState(0);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [initialPosition, setInitialPosition] = useState<[number, number] | null>(null);
    const [selectedSpot, setSelectedSpot] = useState<any | null>(null);
    const [editingSpot, setEditingSpot] = useState<any | null>(null);

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    const [userPosition, setUserPosition] = useState<[number, number] | null>(null);

    // List Mode State
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);

    // Ref to ignore search when programmatically updating the query
    const ignoreSearchRef = useRef(false);

    // Filter spots based on criteria
    const filteredSpots = spots.filter(spot => {
        if (showFavoritesOnly && !spot.isFavorite) return false;
        if (selectedCategories.length > 0 && !selectedCategories.includes(spot.category)) return false;
        if (minRating > 0 && (spot.rating || 0) < minRating) return false;
        if (selectedServices.length > 0) {
            const spotServices = spot.services?.map((s: any) => s.service.name) || [];
            if (!selectedServices.every(s => spotServices.includes(s))) return false;
        }
        return true;
    });

    // Visible spots in List Mode (filtered by map bounds)
    const visibleSpots = filteredSpots.filter(spot => {
        if (!bounds) return true;
        return bounds.contains([spot.latitude, spot.longitude]);
    });

    const handleLocateMe = () => {
        setIsLocating(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setInitialPosition([latitude, longitude]);
                    setUserPosition([latitude, longitude]);
                    setIsLocating(false);
                },
                (error) => {
                    console.error("Error getting location", error);
                    setIsLocating(false);
                    alert("No se pudo obtener tu ubicación. Por favor, asegúrate de que el GPS esté activado.");
                },
                { timeout: 5000, enableHighAccuracy: true }
            );
        } else {
            setIsLocating(false);
            alert("Tu navegador no soporta geolocalización.");
        }
    };

    // Debounced Search Effect
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            // Skip search if we just selected a location
            if (ignoreSearchRef.current) {
                ignoreSearchRef.current = false;
                return;
            }

            if (searchQuery.trim().length > 2) {
                setIsSearching(true);
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
                    const data = await response.json();
                    setSearchResults(data);
                    setShowSearchResults(true);
                } catch (error) {
                    console.error("Search error:", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowSearchResults(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);
    // Geolocation Effect
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
                    setInitialPosition(pos);
                    setUserPosition(pos);
                },
                () => {
                    setInitialPosition([40.416775, -3.70379]); // Default Madrid
                },
                { timeout: 5000 }
            );
        } else {
            setInitialPosition([40.416775, -3.70379]);
        }
    }, []);


    const categories = [
        "NATURE",
        "PARKING_DN",
        "REST_AREA",
        "PICNIC",
        "AC_FREE",
        "AC_PAID",
        "OFFROAD",
        "CAMPING",
        "SERVICE",
        "PARKING_DAY",
        "CANDIDATO"
    ];
    const servicesList = [
        { id: "pets", label: "Se permiten mascotas", icon: "/icons/mascotas.svg" },
        { id: "water", label: "Agua potable", icon: "/icons/agua.svg" },
        { id: "black_water", label: "Aguas negras", icon: "/icons/aguas-negras.svg" },
        { id: "gray_water", label: "Aguas grises", icon: "/icons/aguas-grises.svg" },
        { id: "trash", label: "Cubo de basura", icon: "/icons/basura.svg" },
        { id: "toilets", label: "Baños públicos", icon: "/icons/banos.svg" },
        { id: "showers", label: "Duchas (acceso posible)", icon: "/icons/ducha.svg" },
        { id: "bakery", label: "Panadería", icon: "/icons/panaderia.svg" },
        { id: "electricity", label: "Electricidad (acceso posible)", icon: "/icons/electricidad.svg" },
        { id: "wifi", label: "WIFI", icon: "/icons/wifi.svg" },
        { id: "pool", label: "Piscina", icon: "/icons/piscina.svg" },
        { id: "laundry", label: "Lavandería", icon: "/icons/lavanderia.svg" },
        { id: "car_wash", label: "Lavado de autocaravanas", icon: "/icons/lavado-autocaravanas.svg" },
        { id: "internet", label: "Cobertura 5G", icon: "/icons/5g.svg" },
    ];

    const toggleFilter = (list: string[], item: string, setList: (l: string[]) => void) => {
        if (list.includes(item)) setList(list.filter(i => i !== item));
        else setList([...list, item]);
    };

    if (!initialPosition) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 animate-pulse">Obteniendo ubicación...</p>
                </div>
            </div>
        );
    }

    const handleSelectLocation = (lat: string, lon: string, displayName: string) => {
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);
        if (!isNaN(latNum) && !isNaN(lonNum)) {
            console.log("Flying to:", latNum, lonNum);
            ignoreSearchRef.current = true; // Prevent search effect from re-opening list
            setInitialPosition([latNum, lonNum]);
            setSearchQuery(displayName.split(',')[0]);
            setShowSearchResults(false);
            setSearchResults([]); // Clear results after selection
        }
    };

    return (
        <div className="relative h-screen w-full z-0">
            {/* Disabled zoomControl to mimic clean UI, map controls usually top-left by default */}
            <MapContainer center={initialPosition} zoom={14} scrollWheelZoom={true} className="h-full w-full" zoomControl={false}>
                <MapEvents setBounds={setBounds} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* MapController handles programmatic moves */}
                <MapController center={initialPosition} />

                {/* Blue GPS position dot */}
                <LocationMarker position={userPosition} />

                {filteredSpots?.map((spot) => (
                    <Marker
                        key={spot.id}
                        position={[spot.latitude, spot.longitude]}
                        icon={createCustomIcon(spot.category)}
                        eventHandlers={{
                            click: () => {
                                setSelectedSpot(spot);
                            },
                        }}
                    >
                    </Marker>
                ))}
            </MapContainer>

            {/* List View Overlay */}
            {viewMode === 'list' && (
                <div className="absolute inset-0 z-[500] bg-gray-50 pt-24 md:pt-20">
                    <SpotList
                        spots={visibleSpots}
                        onSpotClick={(spot) => {
                            setSelectedSpot(spot);
                            // Optional: switch back to map on click?
                            // user might want to see details in list context?
                            // Actually SpotDetail is a modal, so it works.
                        }}
                    />
                </div>
            )}

            {/* Spot Detail Overlay */}
            {selectedSpot && (
                <SpotDetail
                    spot={selectedSpot}
                    onClose={() => setSelectedSpot(null)}
                    onEdit={(spot) => {
                        setEditingSpot(spot);
                        setSelectedSpot(null);
                    }}
                />
            )}

            {/* Edit Wizard Overlay */}
            {editingSpot && (
                <AddSpotWizard
                    spot={editingSpot}
                    onCancel={() => {
                        setEditingSpot(null);
                        // Optional: trigger a refresh of spots data if needed?
                        // Actions usually revalidatePath("/") but client side we might need to refresh state
                        window.location.reload();
                    }}
                />
            )}

            {/* Top Right Controls Container */}
            <div className="fixed top-4 right-4 z-[1500] flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative z-[1600]">
                    <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 h-10 w-40 md:w-64 border border-gray-200 focus-within:ring-2 focus-within:ring-green-100 transition-shadow">
                        <input
                            type="text"
                            placeholder="Ciudad, país, dirección"
                            className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => {
                                if (searchResults.length > 0) setShowSearchResults(true);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (searchResults.length > 0) {
                                        // Select first result
                                        const first = searchResults[0];
                                        handleSelectLocation(first.lat, first.lon, first.display_name);
                                    } else {
                                        // Trigger immediate search if no results yet (though debounce handles this usually)
                                        // Or just wait for debounce. For now, rely on debounce state.
                                    }
                                }
                            }}
                        />
                        <div className="text-gray-400">
                            {isSearching ? (
                                <div className="w-5 h-5 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin"></div>
                            ) : (
                                <Search className="w-5 h-5" />
                            )}
                        </div>
                    </div>

                    {/* Autocomplete Results */}
                    {showSearchResults && searchResults.length > 0 && (
                        <div className="absolute top-12 left-0 w-40 md:w-64 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-[3000]">
                            {searchResults.map((result: any, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 border-b border-gray-50 last:border-0 transition-colors flex items-center gap-2"
                                    onClick={() => handleSelectLocation(result.lat, result.lon, result.display_name)}
                                >
                                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="line-clamp-1">{result.display_name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Filter Button */}
                <button
                    onClick={() => setShowFilters(true)}
                    className={`h-10 w-10 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-200 transition-transform active:scale-95 ${showFilters || selectedCategories.length > 0 ? 'text-blue-600 ring-2 ring-blue-100' : 'text-gray-600'}`}
                >
                    <Filter className="h-5 w-5" />
                </button>

                {/* List/Map Toggle */}
                <button
                    onClick={() => setViewMode(prev => prev === 'map' ? 'list' : 'map')}
                    className={`h-10 w-10 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-200 transition-transform active:scale-95 ${viewMode === 'list' ? 'text-blue-600 ring-2 ring-blue-100' : 'text-gray-600'}`}
                    title={viewMode === 'map' ? "Ver lista" : "Ver mapa"}
                >
                    {viewMode === 'map' ? (
                        <List className="h-5 w-5" />
                    ) : (
                        <MapIcon className="h-5 w-5" />
                    )}
                </button>

                {/* Locate Me Button */}
                <button
                    onClick={handleLocateMe}
                    disabled={isLocating}
                    className={`h-10 w-10 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-200 transition-all active:scale-95 ${isLocating ? 'text-emerald-500 animate-pulse' : 'text-gray-600 hover:text-emerald-500'}`}
                    title="Mi posición"
                >
                    <Crosshair className={`h-5 w-5 ${isLocating ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Filter Modal Overlay */}
            {
                showFilters && (
                    <div className="fixed inset-0 z-[5000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in active:animate-none">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <div className="w-6"></div> {/* Spacer for centering */}
                                <h2 className="text-lg font-bold text-gray-800">Filtros</h2>
                                <button onClick={() => setShowFilters(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                                {/* Rating and Favorites Section */}
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-3">Preferencias:</h3>

                                    {/* Favorites Toggle */}
                                    <label className="flex items-center justify-between p-3 bg-red-50 rounded-xl cursor-pointer mb-4 border border-red-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                                                <Heart className={`w-5 h-5 ${showFavoritesOnly ? "fill-current" : ""}`} />
                                            </div>
                                            <span className="font-medium text-gray-900">Solo Favoritos</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={showFavoritesOnly}
                                            onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
                                        />
                                    </label>

                                    {/* Rating Slider/Selector */}
                                    <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-900 flex items-center gap-2">
                                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                Valoración mínima
                                            </span>
                                            <span className="text-sm font-bold text-yellow-600 bg-white px-2 py-0.5 rounded-full shadow-sm">
                                                {minRating > 0 ? `${minRating}+` : "Cualquiera"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center px-1">
                                            {[0, 1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    onClick={() => setMinRating(star)}
                                                    className={`p-1 transition-transform active:scale-95 flex flex-col items-center gap-1 group`}
                                                    title={star === 0 ? "Cualquiera" : `${star} estrellas`}
                                                >
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${minRating >= star && star > 0
                                                        ? "bg-yellow-400 text-white shadow-md scale-110"
                                                        : minRating === 0 && star === 0
                                                            ? "bg-gray-200 text-gray-600"
                                                            : "bg-white text-gray-300 border border-gray-100 hover:border-yellow-200"
                                                        }`}>
                                                        {star === 0 ? (
                                                            <span className="text-xs font-bold">Todo</span>
                                                        ) : (
                                                            <Star className={`w-4 h-4 ${minRating >= star ? "fill-current" : ""}`} />
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Categories Section */}
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-3">Filtrar tipos de lugares:</h3>
                                    <div className="space-y-1">
                                        {categories.map(cat => {
                                            const isChecked = selectedCategories.length === 0 || selectedCategories.includes(cat);
                                            const style = getCategoryStyles(cat);
                                            return (
                                                <label key={cat} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        {/* Icon container */}
                                                        <div className="w-8 h-8 flex items-center justify-center">
                                                            <img src={style.img} alt={style.label} className="w-full h-full" />
                                                        </div>
                                                        <span className="text-gray-700 font-medium">{style.label}</span>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCategories.includes(cat)}
                                                        onChange={() => toggleFilter(selectedCategories, cat, setSelectedCategories)}
                                                        className="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                                                    />
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Services Section */}
                                <div>



                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 mt-6">Servicios cercanos</h4>
                                    <div className="space-y-1">
                                        {servicesList.map(srv => {
                                            const isChecked = selectedServices.includes(srv.label);
                                            return (
                                                <label key={srv.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-lg overflow-hidden p-1">
                                                            {srv.icon.startsWith('/') ? (
                                                                <img src={srv.icon} alt={srv.label} className="w-full h-full object-contain" />
                                                            ) : (
                                                                srv.icon
                                                            )}
                                                        </div>
                                                        <span className="text-gray-700 font-medium text-sm">{srv.label}</span>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => toggleFilter(selectedServices, srv.label, setSelectedServices)}
                                                        className="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                                                    />
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-gray-100 bg-white">
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="w-full bg-[#34d399] hover:bg-[#10b981] text-white font-bold py-3 px-6 rounded-full shadow-lg transition-transform active:scale-95"
                                >
                                    Aplicar filtros {(selectedCategories.length + selectedServices.length) > 0 ? `(${selectedCategories.length + selectedServices.length})` : ''}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
}
