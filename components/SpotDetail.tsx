/* eslint-disable */
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Navigation, Star, Share2, MapPin, Map, Phone, Globe, Mail, ChevronLeft, ChevronRight, Flag, Trash2, Edit2, Maximize2, ExternalLink, Camera, Heart, Clock, User, AlertCircle, CheckCircle2, Mountain } from "lucide-react";
import { getCategoryStyles } from "@/lib/categories";
import { getServiceIconPath } from "@/lib/services";
import FavoriteButton from "./FavoriteButton";
import { deleteSpot, updateSpot } from "@/lib/actions";
import { useRouter } from "next/navigation";

interface SpotDetailProps {
    spot: any;
    onClose: () => void;
    onEdit?: (spot: any) => void;
}

const SVGs = {
    pets: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M19 6h-2c0-1.1-.9-2-2-2h-3v2h3v2H9V6h3V4H9c-1.1 0-2 .9-2 2H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm10 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" /></svg>,
    water: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" /></svg>,
    // Add other specific SVGs as needed, using generic Lucide for now in the map below for speed if distinct ones aren't critical
};

export default function SpotDetail({ spot, onClose, onEdit }: SpotDetailProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Reset index when spot changes
    if (spot && spot.id !== spot.id) setActiveIndex(0);

    if (!spot) return null;
    if (!mounted) return null;

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (spot.images && spot.images.length > 0) {
            setActiveIndex((prev) => (prev + 1) % spot.images.length);
        }
    };

    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (spot.images && spot.images.length > 0) {
            setActiveIndex((prev) => (prev - 1 + spot.images.length) % spot.images.length);
        }
    };

    const handleDelete = async () => {
        if (confirm("¿Estás seguro de que quieres borrar este sitio? Esta acción no se puede deshacer.")) {
            const result = await deleteSpot(spot.id);
            if (result.success) {
                onClose();
                // We might need a full refresh or just rely on revalidatePath
                // Since markers are fetched on the client usually, a refresh is safer or manual state clear
                window.location.reload();
            } else {
                alert("Error al borrar el sitio: " + result.error);
            }
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[2000] flex justify-end pointer-events-none">
            {/* Backdrop - clickable to close */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-[1px] pointer-events-auto transition-opacity"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative w-full max-w-md h-full bg-white shadow-2xl pointer-events-auto overflow-y-auto animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center justify-between px-4 py-3">
                    <button
                        onClick={onClose}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    <div className="flex items-center gap-2">

                        <h2 className="font-bold text-gray-800 line-clamp-1">{spot.title}</h2>
                    </div>

                    <div className="flex items-center gap-1">

                        <button className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-full">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="pb-20">

                    {/* Action Buttons */}
                    <div className="flex justify-around items-center py-6 border-b border-gray-50">
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                                <Navigation className="w-6 h-6 fill-current" />
                            </div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Itinerario</span>
                        </a>

                        <div className="flex flex-col items-center gap-2 group cursor-pointer">
                            <div className="w-12 h-12 rounded-full bg-white border-2 border-yellow-400 text-yellow-400 flex items-center justify-center shadow-md group-hover:bg-yellow-50 transition-colors">
                                <FavoriteButton spotId={spot.id} initialIsFavorite={spot.isFavorite} className="hover:scale-110 transition-transform" />
                            </div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Favoritos</span>
                        </div>

                        <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => onEdit?.(spot)}>
                            <div className="w-12 h-12 rounded-full bg-white border-2 border-blue-200 text-blue-400 flex items-center justify-center shadow-md group-hover:bg-blue-50 group-hover:border-blue-400 transition-all">
                                <Edit2 className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Editar</span>
                        </div>

                        <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={handleDelete}>
                            <div className="w-12 h-12 rounded-full bg-white border-2 border-red-200 text-red-400 flex items-center justify-center shadow-md group-hover:bg-red-50 group-hover:border-red-400 transition-all">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Borrar</span>
                        </div>
                    </div>

                    {/* Image Carousel */}
                    {spot.images && spot.images.length > 0 ? (
                        <div className="h-64 w-full bg-gray-900 relative group overflow-hidden">
                            <img
                                src={spot.images[activeIndex].url}
                                alt={spot.title}
                                className="w-full h-full object-cover cursor-pointer transition-transform duration-500 hover:scale-105"
                                onClick={() => setLightboxOpen(true)}
                            />

                            {/* Navigation Arrows (Visible on hover or always on mobile) */}
                            {spot.images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </>
                            )}

                            {/* Counter badge */}
                            <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-2">
                                <span>{activeIndex + 1} / {spot.images.length}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 w-full bg-gray-100 relative group overflow-hidden">
                            <img
                                src="/placeholder-image.jpg"
                                alt="Sin imágenes"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Description & Info */}
                    <div className="p-5 space-y-6">

                        {/* Title & Category */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 flex items-center justify-center">
                                    <img
                                        src={
                                            spot.category === "NATURE" ? "/icons/naturaleza.svg" :
                                                spot.category === "PARKING_DN" ? "/icons/parking.svg" :
                                                    spot.category === "REST_AREA" ? "/icons/area-descanso.svg" :
                                                        spot.category === "PICNIC" ? "/icons/picnic.svg" :
                                                            spot.category === "AC_FREE" ? "/icons/autocaravana.svg" :
                                                                spot.category === "AC_PAID" ? "/icons/ac_pago.svg" :
                                                                    spot.category === "OFFROAD" ? "/icons/4x4.svg" :
                                                                        spot.category === "CAMPING" ? "/icons/camping.svg" :
                                                                            spot.category === "SERVICE" ? "/icons/area-servicios.svg" :
                                                                                spot.category === "PARKING_DAY" ? "/icons/parking-dia.svg" :
                                                                                    spot.category === "CANDIDATO" ? "/icons/candidato.svg" : "/icons/parking.svg"
                                        }
                                        alt={spot.category}
                                        className="w-full h-full"
                                    />
                                </div>
                                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full uppercase tracking-tight">
                                    {
                                        spot.category === "NATURE" ? "En plena naturaleza" :
                                            spot.category === "PARKING_DN" ? "Aparcamiento día y noche" :
                                                spot.category === "REST_AREA" ? "Área de descanso" :
                                                    spot.category === "PICNIC" ? "Zona de picnic" :
                                                        spot.category === "AC_FREE" ? "Área de AC gratuita" :
                                                            spot.category === "AC_PAID" ? "Área de AC de pago" :
                                                                spot.category === "OFFROAD" ? "Off-road (4x4)" :
                                                                    spot.category === "CAMPING" ? "Camping" :
                                                                        spot.category === "SERVICE" ? "Área de servicios sin aparcamiento" :
                                                                            spot.category === "PARKING_DAY" ? "Aparcamiento solo día" :
                                                                                spot.category === "CANDIDATO" ? "Candidato" : spot.category
                                    }
                                </span>
                            </div>
                            <p className="text-gray-700 leading-relaxed text-sm">
                                {spot.description || "Sin descripción disponible."}
                            </p>
                        </div>

                        {/* Metadata Grid */}
                        <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4 border border-gray-100">
                            <div>
                                <p className="text-xs font-bold text-blue-900/60 mb-1">Precio</p>
                                <p className={`font-semibold ${spot.isFree ? "text-emerald-600" : "text-amber-600"}`}>
                                    {spot.isFree ? "Gratuito" : "De pago"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-blue-900/60 mb-1">Plazas</p>
                                <p className="font-semibold text-gray-900">
                                    {spot.places ? `${spot.places}${spot.places >= 5 ? "+" : ""}` : "?"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-blue-900/60 mb-1">Agregado</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(spot.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                </p>
                            </div>
                        </div>

                        {/* Services */}
                        <div>
                            <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Servicios</h3>
                            <div className="flex flex-wrap gap-2">
                                {spot.services && spot.services.length > 0 ? (
                                    spot.services.map((s: any) => {
                                        const iconPath = getServiceIconPath(s.service.name);

                                        return (
                                            <div key={s.service.name} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                                                {iconPath ? (
                                                    <img src={iconPath} className="w-5 h-5" alt={s.service.name} />
                                                ) : (
                                                    <span className="text-lg">🔧</span>
                                                )}
                                                <span className="text-sm text-gray-700">{s.service.name}</span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-gray-500 italic text-sm">No hay servicios registrados.</p>
                                )}
                            </div>
                        </div>

                        {/* Coordinates */}
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${spot.latitude},${spot.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group"
                        >
                            <div className="bg-emerald-50 rounded-lg p-3 flex items-center justify-between gap-3 border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-mono text-emerald-900">{spot.latitude.toFixed(5)}, {spot.longitude.toFixed(5)}</p>
                                        <p className="text-xs text-emerald-700/70">Coordenadas GPS exactas</p>
                                    </div>
                                </div>
                                <div className="bg-emerald-200/50 p-2 rounded-full text-emerald-700 group-hover:bg-emerald-200 transition-colors">
                                    <ExternalLink className="w-4 h-4" />
                                </div>
                            </div>
                        </a>

                        {/* Wikiloc Link */}
                        <a
                            href={`https://www.wikiloc.com/wikiloc/map.do?lt=${spot.latitude}&ln=${spot.longitude}&z=15`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group mt-3"
                        >
                            <div className="bg-lime-50 rounded-lg p-3 flex items-center justify-between gap-3 border border-lime-100 group-hover:bg-lime-100 transition-colors">
                                <div className="flex items-start gap-3">
                                    <Mountain className="w-5 h-5 text-lime-600 flex-shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-lime-900">Ver rutas en Wikiloc</p>
                                        <p className="text-xs text-lime-700/70">Descubre senderos cercanos</p>
                                    </div>
                                </div>
                                <div className="bg-lime-200/50 p-2 rounded-full text-lime-700 group-hover:bg-lime-200 transition-colors">
                                    <ExternalLink className="w-4 h-4" />
                                </div>
                            </div>
                        </a>

                        {/* Reviews */}
                        <div className="pt-6 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900">Reseñas</h3>
                                <div className="flex text-yellow-400">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`w-4 h-4 ${((spot.rating || 0) >= star) ? "fill-current text-yellow-400" : "text-gray-300"}`}
                                        />
                                    ))}
                                    <span className="ml-2 text-sm text-gray-500 font-medium">({spot.rating || 0}/5)</span>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>
            </div>
            {/* Lightbox Overlay */}
            {mounted && lightboxOpen && spot.images && spot.images.length > 0 && createPortal(
                <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center animate-in fade-in duration-200 pointer-events-auto">
                    {/* Close Button */}
                    <button
                        onClick={() => setLightboxOpen(false)}
                        className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    {/* Main Image */}
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                        <img
                            src={spot.images[activeIndex].url}
                            alt={`Full screen view ${activeIndex + 1}`}
                            className="max-w-full max-h-full object-contain shadow-2xl"
                        />

                        {/* Navigation */}
                        {spot.images.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all"
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-all"
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Thumbnails / Counter */}
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto">
                        <div className="bg-black/60 rounded-full px-4 py-2 text-white font-bold">
                            {activeIndex + 1} / {spot.images.length}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>,
        document.body
    );
}

