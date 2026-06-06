/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { Icon } from "@/components/Icon";
import FavoriteButton from "./FavoriteButton";
import { getPlaceType, getSpotStatus, getServiceIcon, coverPhoto } from "@/lib/placeTypes";
import { deleteSpot } from "@/lib/actions";

const AddPernoctaModal = dynamic(() => import("./AddPernoctaModal"), { ssr: false });

interface SpotDetailProps {
    spot: any;
    onClose: () => void;
    onEdit?: (spot: any) => void;
}

export default function SpotDetail({ spot, onClose, onEdit }: SpotDetailProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showPernocta, setShowPernocta] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    if (!spot || !mounted) return null;

    const type     = getPlaceType(spot.category);
    const status   = getSpotStatus(spot.category);
    const images   = spot.images ?? [];
    const allPhotos = images.length > 0 ? images.map((i: any) => i.url) : ["/default-place.png"];

    const next = (e?: React.MouseEvent) => { e?.stopPropagation(); setActiveIndex(i => (i + 1) % allPhotos.length); };
    const prev = (e?: React.MouseEvent) => { e?.stopPropagation(); setActiveIndex(i => (i - 1 + allPhotos.length) % allPhotos.length); };

    const mapsUrl   = `https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`;
    const wikiloc   = `https://www.wikiloc.com/wikiloc/map.do?lt=${spot.latitude}&ln=${spot.longitude}&z=15`;
    const mapsQuery = `https://www.google.com/maps/search/?api=1&query=${spot.latitude},${spot.longitude}`;

    const createdAt = new Date(spot.createdAt).toLocaleDateString("es-ES", {
        day: "2-digit", month: "2-digit", year: "2-digit",
    });

    return createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", justifyContent: "flex-end", pointerEvents: "none" }}>
            {/* Backdrop */}
            <div
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(1px)", pointerEvents: "auto" }}
                onClick={onClose}
            />

            {/* Panel */}
            <div style={{
                position: "relative", width: "100%", maxWidth: 420, height: "100%",
                background: "var(--surface)", boxShadow: "var(--shadow-lg)",
                pointerEvents: "auto", overflowY: "auto", display: "flex", flexDirection: "column",
            }}>

                {/* ── Foto con botones flotantes ── */}
                <div style={{ position: "relative", height: 240, flexShrink: 0, background: "var(--surface-2)" }}>
                    <img
                        src={allPhotos[activeIndex]}
                        alt={spot.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", cursor: images.length > 0 ? "pointer" : "default" }}
                        onClick={() => images.length > 0 && setLightboxOpen(true)}
                    />

                    {/* Prev/Next */}
                    {allPhotos.length > 1 && (
                        <>
                            <button onClick={prev} className="iconbtn" style={{
                                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                                width: 34, height: 34, background: "rgba(0,0,0,0.4)", color: "#fff",
                            }}>
                                <Icon name="back" size={16} />
                            </button>
                            <button onClick={next} className="iconbtn" style={{
                                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                                width: 34, height: 34, background: "rgba(0,0,0,0.4)", color: "#fff",
                            }}>
                                <Icon name="chevron" size={16} />
                            </button>
                            <div style={{
                                position: "absolute", bottom: 10, right: 10,
                                background: "rgba(0,0,0,0.5)", color: "#fff",
                                borderRadius: 99, padding: "3px 10px", fontSize: 12, fontWeight: 700,
                            }}>
                                {activeIndex + 1} / {allPhotos.length}
                            </div>
                        </>
                    )}

                    {/* Floating back + share */}
                    <button
                        onClick={onClose}
                        className="iconbtn"
                        style={{
                            position: "absolute", top: 12, left: 12,
                            width: 36, height: 36,
                            background: "rgba(255,255,255,0.85)", backdropFilter: "blur(6px)",
                            color: "var(--text)",
                        }}
                    >
                        <Icon name="back" size={18} />
                    </button>
                    <button
                        className="iconbtn"
                        style={{
                            position: "absolute", top: 12, right: 12,
                            width: 36, height: 36,
                            background: "rgba(255,255,255,0.85)", backdropFilter: "blur(6px)",
                            color: "var(--text)",
                        }}
                        onClick={() => navigator.share?.({ title: spot.title, url: window.location.href }).catch(() => {})}
                    >
                        <Icon name="share" size={18} />
                    </button>
                </div>

                {/* ── Contenido ── */}
                <div style={{ flex: 1, paddingBottom: 40 }}>
                    <div style={{ padding: "16px 16px 0" }}>

                        {/* Chips: tipo + estado */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <div className="type-chip is-on" style={{ "--tc": type.color } as any}>
                                <div style={{
                                    width: 20, height: 20, borderRadius: 99, background: type.color,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <Icon name={type.icon} size={11} style={{ color: "#fff" }} />
                                </div>
                                {type.short}
                            </div>
                            {status === "candidato" ? (
                                <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 800,
                                    background: "#FFF0EB", color: "#E2562A",
                                }}>
                                    <Icon name="questionMark" size={10} /> Candidato
                                </span>
                            ) : (
                                <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 800,
                                    background: "var(--success-soft)", color: "var(--success)",
                                }}>
                                    <Icon name="check" size={10} /> Verificado
                                </span>
                            )}
                        </div>

                        {/* Nombre */}
                        <h1 style={{
                            fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em",
                            color: "var(--text)", margin: "0 0 4px",
                        }}>
                            {spot.title}
                        </h1>

                        {/* Valoración */}
                        {spot.rating > 0 && (
                            <p style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, margin: "0 0 14px" }}>
                                {"★".repeat(Math.round(spot.rating))}{"☆".repeat(5 - Math.round(spot.rating))}
                                <span style={{ marginLeft: 5 }}>{spot.rating.toFixed(1)} / 5</span>
                            </p>
                        )}
                        {spot.rating === 0 && (
                            <p style={{ fontSize: 13, color: "var(--faint)", margin: "0 0 14px" }}>Sin reseñas todavía</p>
                        )}

                        {/* Cómo llegar */}
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", marginBottom: 18 }}>
                            <div className="btn btn-primary btn-lg btn-full" style={{ gap: 8 }}>
                                <Icon name="navigate" size={18} />
                                Cómo llegar
                            </div>
                        </a>

                        {/* 4 acciones */}
                        <div style={{
                            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                            borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
                            padding: "12px 0", marginBottom: 20,
                        }}>
                            {/* Favorito */}
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                                <FavoriteButton spotId={spot.id} initialIsFavorite={spot.isFavorite} size={22} variant="plain" />
                                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>Favorito</span>
                            </div>
                            {/* Pernoctar */}
                            <button
                                onClick={() => setShowPernocta(true)}
                                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer" }}
                            >
                                <Icon name="moon" size={22} style={{ color: "var(--text-2)" }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>Pernoctar</span>
                            </button>
                            {/* Editar */}
                            <button
                                onClick={() => onEdit?.(spot)}
                                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer" }}
                            >
                                <Icon name="edit" size={22} style={{ color: "var(--text-2)" }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>Editar</span>
                            </button>
                            {/* Borrar */}
                            <button
                                onClick={async () => {
                                    if (!confirm(`¿Borrar "${spot.title}"? Esta acción no se puede deshacer.`)) return;
                                    await deleteSpot(spot.id);
                                    onClose();
                                }}
                                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer" }}
                            >
                                <Icon name="trash" size={22} style={{ color: "var(--danger)" }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--danger)" }}>Borrar</span>
                            </button>
                            {/* Compartir */}
                            <button
                                onClick={() => navigator.share?.({ title: spot.title, url: window.location.href }).catch(() => {})}
                                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer" }}
                            >
                                <Icon name="share" size={22} style={{ color: "var(--text-2)" }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>Compartir</span>
                            </button>
                        </div>

                        {/* Stats: precio · plazas · añadido */}
                        <div style={{
                            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 10, marginBottom: 20,
                        }}>
                            {[
                                { label: "PRECIO", value: spot.isFree ? "Gratuito" : `${spot.price ?? "—"}€`, highlight: spot.isFree },
                                { label: "PLAZAS", value: spot.places ? `${spot.places}${spot.places >= 5 ? "+" : ""}` : "?", highlight: false },
                                { label: "AÑADIDO", value: createdAt, highlight: false },
                            ].map(s => (
                                <div key={s.label} style={{ textAlign: "center" }}>
                                    <p style={{ fontSize: 10, fontWeight: 700, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>
                                        {s.label}
                                    </p>
                                    <p style={{ fontSize: 15, fontWeight: 800, color: s.highlight ? "var(--success)" : "var(--text)", margin: 0 }}>
                                        {s.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Descripción */}
                        {spot.description && (
                            <div style={{ marginBottom: 20 }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                                    Descripción
                                </p>
                                <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
                                    {spot.description}
                                </p>
                            </div>
                        )}

                        {/* Servicios */}
                        {spot.services?.length > 0 && (
                            <div style={{ marginBottom: 20 }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                                    Servicios
                                </p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                    {spot.services.map((s: any) => (
                                        <div key={s.service.name} style={{
                                            display: "flex", alignItems: "center", gap: 8,
                                            padding: "8px 12px", borderRadius: 12,
                                            background: "var(--surface-2)", color: "var(--text-2)",
                                            fontSize: 13, fontWeight: 600,
                                        }}>
                                            <Icon name={getServiceIcon(s.service.name)} size={15} style={{ color: "var(--primary)", flexShrink: 0 }} />
                                            {s.service.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* GPS coords */}
                        <a href={mapsQuery} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", marginBottom: 8 }}>
                            <div style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "12px 14px", borderRadius: 14,
                                background: "var(--surface-2)", gap: 10,
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <Icon name="pin" size={18} style={{ color: "var(--primary)", flexShrink: 0 }} />
                                    <div>
                                        <p style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "var(--text)", margin: "0 0 2px" }}>
                                            {spot.latitude.toFixed(5)}, {spot.longitude.toFixed(5)}
                                        </p>
                                        <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>Coordenadas GPS exactas</p>
                                    </div>
                                </div>
                                <Icon name="external" size={15} style={{ color: "var(--muted)", flexShrink: 0 }} />
                            </div>
                        </a>

                        {/* Wikiloc */}
                        <a href={wikiloc} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", marginBottom: 20 }}>
                            <div style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "12px 14px", borderRadius: 14,
                                background: "var(--surface-2)", gap: 10,
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <Icon name="mountain" size={18} style={{ color: "var(--success)", flexShrink: 0 }} />
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: "0 0 2px" }}>Ver rutas en Wikiloc</p>
                                        <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>Descubre senderos cercanos</p>
                                    </div>
                                </div>
                                <Icon name="external" size={15} style={{ color: "var(--muted)", flexShrink: 0 }} />
                            </div>
                        </a>

                        {/* Reseñas */}
                        <div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                                    Reseñas
                                </p>
                                {spot.rating > 0 && (
                                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--warning)" }}>
                                        ★ {spot.rating.toFixed(1)} / 5
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => onEdit?.(spot)}
                                style={{
                                    width: "100%", padding: "12px 0", borderRadius: 14,
                                    border: "1.5px solid var(--border)", background: "var(--surface-2)",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    fontSize: 14, fontWeight: 700, color: "var(--muted)", cursor: "pointer",
                                }}
                            >
                                <Icon name="star" size={16} />
                                Escribir una reseña
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Lightbox ── */}
            {lightboxOpen && mounted && images.length > 0 && createPortal(
                <div style={{
                    position: "fixed", inset: 0, zIndex: 10000, background: "#000",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <button onClick={() => setLightboxOpen(false)} className="iconbtn" style={{
                        position: "absolute", top: 16, right: 16, width: 44, height: 44,
                        background: "rgba(255,255,255,0.12)", color: "white",
                    }}>
                        <Icon name="close" size={22} />
                    </button>
                    <img src={allPhotos[activeIndex]} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", padding: 16 }} />
                    {allPhotos.length > 1 && (
                        <>
                            <button onClick={prev} className="iconbtn" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, background: "rgba(255,255,255,0.15)", color: "white" }}>
                                <Icon name="back" size={20} />
                            </button>
                            <button onClick={next} className="iconbtn" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, background: "rgba(255,255,255,0.15)", color: "white" }}>
                                <Icon name="chevron" size={20} />
                            </button>
                            <div style={{ position: "absolute", bottom: 24, background: "rgba(0,0,0,0.5)", color: "white", borderRadius: 99, padding: "4px 14px", fontSize: 13, fontWeight: 700 }}>
                                {activeIndex + 1} / {allPhotos.length}
                            </div>
                        </>
                    )}
                </div>,
                document.body
            )}

            {/* ── Modal pernocta ── */}
            {showPernocta && (
                <AddPernoctaModal
                    initialLat={spot.latitude}
                    initialLon={spot.longitude}
                    initialSpotId={spot.id}
                    onClose={() => setShowPernocta(false)}
                />
            )}
        </div>,
        document.body
    );
}
