"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import { createSpot, updateSpot } from "@/lib/actions";
import { getGPSFromImage } from "@/lib/exif";
import { Icon, type IconName } from "@/components/Icon";
import { PLACE_TYPES, SPOT_SERVICES } from "@/lib/placeTypes";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
    ssr: false,
    loading: () => (
        <div style={{
            height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--surface-2)", color: "var(--muted)", fontSize: 14,
        }}>
            Cargando mapa…
        </div>
    ),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseLatLng(raw: string): { lat: number; lng: number } | null {
    // DMS: 37°39'30.5"N 3°43'04.2"W
    const dmsRx = /(\d+)[°º]\s*(\d+)[`'′]\s*(\d+(?:[.,]\d+)?)[″""]\s*([NS])\s+(\d+)[°º]\s*(\d+)[`'′]\s*(\d+(?:[.,]\d+)?)[″""]\s*([EW])/i;
    const d = dmsRx.exec(raw.trim());
    if (d) {
        const cvt = (deg: string, min: string, sec: string, dir: string) => {
            const v = +deg + +min / 60 + parseFloat(sec.replace(",", ".")) / 3600;
            return /[SW]/i.test(dir) ? -v : v;
        };
        return { lat: cvt(d[1], d[2], d[3], d[4]), lng: cvt(d[5], d[6], d[7], d[8]) };
    }
    // Decimal: "37.123, -3.456" or "37.123 -3.456"
    const parts = raw.trim().replace(/,/g, " ").split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)
            return { lat, lng };
    }
    return null;
}

const TYPE_LIST = Object.values(PLACE_TYPES);

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
    spot?: any;
    onCancel?: () => void;
    initialPhoto?: File;
    initialLat?: number;
    initialLon?: number;
}

export default function AddSpotWizard({ spot, onCancel, initialPhoto, initialLat, initialLon }: Props) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [step, setStep] = useState(1);
    const TOTAL_STEPS = 4;

    // Location mode (step 1)
    const [locMode, setLocMode] = useState<"map" | "coords" | "photo">("map");
    const [mapFlyTo, setMapFlyTo] = useState<[number, number] | undefined>(undefined);

    // Map search (step 1)
    const [mapSearch, setMapSearch] = useState("");
    const [mapSearchResults, setMapSearchResults] = useState<any[]>([]);
    const [mapSearching, setMapSearching] = useState(false);
    const mapSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMapSearchChange = (val: string) => {
        setMapSearch(val);
        if (mapSearchRef.current) clearTimeout(mapSearchRef.current);
        if (!val.trim() || val.trim().length < 2) { setMapSearchResults([]); return; }
        mapSearchRef.current = setTimeout(async () => {
            setMapSearching(true);
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5`);
                setMapSearchResults(await res.json());
            } catch { /* ignore */ }
            finally { setMapSearching(false); }
        }, 400);
    };

    const handleMapSearchSelect = (r: any) => {
        const lat = parseFloat(r.lat);
        const lng = parseFloat(r.lon);
        setFormData(p => ({ ...p, latitude: lat, longitude: lng }));
        setMapFlyTo([lat, lng]);
        setMapSearch(r.display_name.split(",")[0]);
        setMapSearchResults([]);
    };
    const [coordInput, setCoordInput] = useState("");
    const [coordValid, setCoordValid] = useState<boolean | null>(null);
    const [exifStatus, setExifStatus] = useState<"idle" | "found" | "notfound">("idle");
    const [exifFile, setExifFile] = useState<File | null>(null);
    const exifInputRef = useRef<HTMLInputElement>(null);

    const handleLocModeChange = (mode: "map" | "coords" | "photo") => {
        setLocMode(mode);
        if (mode !== "photo") { setExifFile(null); setExifStatus("idle"); }
    };

    // Form data
    const [formData, setFormData] = useState({
        latitude:  spot?.latitude  ?? initialLat ?? 40.416775,
        longitude: spot?.longitude ?? initialLon ?? -3.70379,
        category:  spot?.category  ?? "NATURE",
        title:     spot?.title     ?? "",
        description: spot?.description ?? "",
        services:  (spot?.services?.map((s: any) => s.service.name) as string[]) ?? [],
        images:    (spot?.images?.map((img: any) => img.url) as (File | string)[]) ??
                   (initialPhoto ? [initialPhoto] : []) as (File | string)[],
        rating:    spot?.rating ?? 0,
        isFree:    spot?.isFree ?? true,
        places:    spot?.places ?? 1,
    });

    // Cropper state
    const [croppingIdx, setCroppingIdx]   = useState<number | null>(null);
    const [imageSrc, setImageSrc]         = useState<string | null>(null);
    const [crop, setCrop]                 = useState({ x: 0, y: 0 });
    const [zoom, setZoom]                 = useState(1);
    const [aspect, setAspect]             = useState(4 / 3);
    const [croppedPixels, setCroppedPixels] = useState<any>(null);
    const fileInputRef   = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const [isProcessing, setIsProcessing] = useState(false);

    // Geolocation on mount
    useEffect(() => {
        setMounted(true);
        if (spot || initialLat !== undefined) return;
        navigator.geolocation?.getCurrentPosition(
            ({ coords }) => setFormData(p => ({ ...p, latitude: coords.latitude, longitude: coords.longitude })),
            () => {},
            { timeout: 5000 }
        );
    }, []); // eslint-disable-line

    const close = () => { if (onCancel) onCancel(); else router.push("/pois"); };

    // ── Coordinate input live validation ──────────────────────────────────────

    useEffect(() => {
        if (!coordInput.trim()) { setCoordValid(null); return; }
        const result = parseLatLng(coordInput);
        if (result) {
            setCoordValid(true);
            setFormData(p => ({ ...p, latitude: result.lat, longitude: result.lng }));
        } else {
            setCoordValid(false);
        }
    }, [coordInput]);

    // ── EXIF photo picker ──────────────────────────────────────────────────────

    const handleExifPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const gps = await getGPSFromImage(file);
        if (gps) {
            setExifStatus("found");
            setExifFile(file);
            setFormData(p => ({ ...p, latitude: gps.lat, longitude: gps.lon }));
        } else {
            setExifStatus("notfound");
            setExifFile(null);
        }
        e.target.value = "";
    };

    // ── Image crop helpers ────────────────────────────────────────────────────

    const onPhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        if (formData.images.length >= 5) { alert("Máximo 5 fotos."); return; }
        setImageSrc(URL.createObjectURL(e.target.files[0]));
        setCroppingIdx(formData.images.length);
    };

    const saveCrop = async () => {
        if (!imageSrc || !croppedPixels) return;
        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 100));
        try {
            const blob = await getCroppedImg(imageSrc, croppedPixels);
            if (blob) {
                const file = new File([blob], `photo-${Date.now()}.webp`, { type: "image/webp" });
                setFormData(p => {
                    const imgs = [...p.images];
                    if (croppingIdx !== null && croppingIdx < imgs.length) imgs[croppingIdx] = file;
                    else imgs.push(file);
                    return { ...p, images: imgs };
                });
                cancelCrop();
            }
        } catch { /* ignore */ }
        finally { setIsProcessing(false); }
    };

    const cancelCrop = () => {
        setImageSrc(null); setCroppingIdx(null);
        setCrop({ x: 0, y: 0 }); setZoom(1); setAspect(4 / 3);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // ── Submit ────────────────────────────────────────────────────────────────

    const submit = async (quick = false) => {
        setIsProcessing(true);
        try {
            const data = new FormData();
            data.append("title",       quick ? "Nuevo sitio" : (formData.title || "Nuevo sitio"));
            data.append("description", quick ? "" : formData.description);
            data.append("category",    formData.category);
            data.append("latitude",    formData.latitude.toString());
            data.append("longitude",   formData.longitude.toString());
            data.append("rating",      (quick ? 0 : formData.rating).toString());
            data.append("isFree",      (quick ? true : formData.isFree).toString());
            data.append("places",      (quick ? 1 : formData.places).toString());
            if (!quick) {
                formData.services.forEach(s => data.append("services", s));
                formData.images.forEach(img => {
                    if (typeof img === "string") data.append("existingImages", img);
                    else data.append("images", img);
                });
            }
            // Add EXIF photo if picked
            if (exifFile && !quick) data.append("images", exifFile);

            if (spot) await updateSpot(spot.id, data);
            else await createSpot(data);
            close();
        } catch {
            alert("Error al guardar el lugar.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (!mounted) return null;

    const isEditing = !!spot;

    // ── Render helpers ────────────────────────────────────────────────────────

    const coordLabel = `${formData.latitude.toFixed(5)}, ${formData.longitude.toFixed(5)}`;

    const renderStep1 = () => (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

            {/* Location mode tabs */}
            <div style={{ display: "flex", gap: 4, padding: "12px 16px 0", flexShrink: 0 }}>
                {(["map", "coords", "photo"] as const).map((mode) => {
                    const labels = { map: "Mapa", coords: "Coordenadas", photo: "Foto" };
                    const icons: Record<string, IconName> = { map: "map", coords: "sliders", photo: "camera" };
                    const active = locMode === mode;
                    return (
                        <button
                            key={mode}
                            onClick={() => handleLocModeChange(mode)}
                            style={{
                                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                                gap: 5, padding: "8px 4px", borderRadius: 10, fontWeight: 700,
                                fontSize: 13, border: "none", cursor: "pointer",
                                background: active ? "var(--primary-soft)" : "var(--surface-2)",
                                color: active ? "var(--primary-soft-text)" : "var(--muted)",
                                transition: "background .15s, color .15s",
                            }}
                        >
                            <Icon name={icons[mode]} size={14} />
                            {labels[mode]}
                        </button>
                    );
                })}
            </div>

            {/* Location content */}
            <div style={{ flex: 1, position: "relative", overflow: "hidden", margin: "12px 0 0" }}>

                {/* ── MAP mode ── */}
                {locMode === "map" && (
                    <div style={{ height: "100%", position: "relative" }}>
                        <LocationPickerMap
                            lat={formData.latitude}
                            lng={formData.longitude}
                            onMove={(lat, lng) => setFormData(p => ({ ...p, latitude: lat, longitude: lng }))}
                            flyTo={mapFlyTo}
                        />

                        {/* Search overlay */}
                        <div style={{
                            position: "absolute", top: 10, left: 12, right: 12, zIndex: 1000,
                        }}>
                            <div style={{
                                display: "flex", alignItems: "center", gap: 8,
                                background: "var(--surface)", borderRadius: 12,
                                padding: "8px 12px", boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                                border: "1px solid var(--border)",
                            }}>
                                <Icon name="search" size={15} style={{ color: "var(--faint)", flexShrink: 0 }} />
                                <input
                                    type="text"
                                    placeholder="Buscar ciudad o lugar…"
                                    value={mapSearch}
                                    onChange={e => handleMapSearchChange(e.target.value)}
                                    style={{
                                        flex: 1, border: "none", outline: "none", background: "transparent",
                                        fontSize: 13, color: "var(--text)", fontFamily: "var(--font)",
                                    }}
                                />
                                {mapSearching && (
                                    <div style={{
                                        width: 14, height: 14, borderRadius: "50%",
                                        border: "2px solid var(--border)", borderTopColor: "var(--primary)",
                                        animation: "spin .7s linear infinite", flexShrink: 0,
                                    }} />
                                )}
                                {mapSearch && !mapSearching && (
                                    <button
                                        onClick={() => { setMapSearch(""); setMapSearchResults([]); }}
                                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0, color: "var(--muted)" }}
                                    >
                                        <Icon name="close" size={14} />
                                    </button>
                                )}
                            </div>

                            {mapSearchResults.length > 0 && (
                                <div style={{
                                    marginTop: 4, background: "var(--surface)", borderRadius: 12,
                                    boxShadow: "0 4px 16px rgba(0,0,0,0.15)", border: "1px solid var(--border)",
                                    overflow: "hidden",
                                }}>
                                    {mapSearchResults.map((r, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleMapSearchSelect(r)}
                                            style={{
                                                width: "100%", textAlign: "left", padding: "10px 14px",
                                                display: "flex", alignItems: "center", gap: 8,
                                                fontSize: 13, color: "var(--text)", background: "transparent",
                                                border: "none",
                                                borderBottom: i < mapSearchResults.length - 1 ? "1px solid var(--border)" : "none",
                                                cursor: "pointer", fontFamily: "var(--font)",
                                            }}
                                        >
                                            <Icon name="pin" size={13} style={{ color: "var(--muted)", flexShrink: 0 }} />
                                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {r.display_name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Fixed pin overlay */}
                        <div style={{
                            position: "absolute", top: "50%", left: "50%",
                            transform: "translate(-50%, -50%)",
                            zIndex: 900, pointerEvents: "none",
                        }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 99,
                                background: PLACE_TYPES[formData.category]?.color ?? "var(--primary)",
                                border: "3px solid white", boxShadow: "0 2px 10px rgba(0,0,0,0.28)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <Icon name={PLACE_TYPES[formData.category]?.icon ?? "pin"} size={16} style={{ color: "white" }} />
                            </div>
                            <div style={{
                                width: 0, height: 0, margin: "-2px auto 0",
                                borderLeft: "5px solid transparent", borderRight: "5px solid transparent",
                                borderTop: `7px solid ${PLACE_TYPES[formData.category]?.color ?? "var(--primary)"}`,
                            }} />
                        </div>

                        {/* GPS button */}
                        <button
                            className="iconbtn iconbtn-surface"
                            style={{ position: "absolute", bottom: 12, right: 12, zIndex: 900, width: 40, height: 40 }}
                            onClick={() => {
                                navigator.geolocation?.getCurrentPosition(
                                    ({ coords }) => {
                                        setFormData(p => ({ ...p, latitude: coords.latitude, longitude: coords.longitude }));
                                        setMapFlyTo([coords.latitude, coords.longitude]);
                                    },
                                    () => alert("No se pudo obtener la ubicación."),
                                    { timeout: 5000, enableHighAccuracy: true }
                                );
                            }}
                            title="Mi ubicación"
                        >
                            <Icon name="gps" size={18} />
                        </button>

                        {/* Coordinate label */}
                        <div style={{
                            position: "absolute", bottom: 12, left: 12, zIndex: 900,
                            background: "rgba(22,38,29,0.8)", color: "#ECF3EE",
                            padding: "4px 10px", borderRadius: 8,
                            fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600,
                            backdropFilter: "blur(4px)",
                        }}>
                            {coordLabel}
                        </div>
                    </div>
                )}

                {/* ── COORDS mode ── */}
                {locMode === "coords" && (
                    <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10, height: "100%", overflowY: "auto" }}>
                        <div>
                            <label className="label">Introduce coordenadas</label>
                            <input
                                className={`input ${coordValid === false ? "is-error" : ""}`}
                                placeholder="37.123, -3.456 · o DMS: 37°39′30″N 3°43′04″W"
                                value={coordInput}
                                onChange={e => setCoordInput(e.target.value)}
                                autoFocus
                                style={{ fontFamily: "var(--mono)" }}
                            />
                            {coordValid === false && (
                                <p className="input-hint is-error">Formato no reconocido. Prueba decimal o DMS.</p>
                            )}
                            {coordValid === true && (
                                <p className="input-hint" style={{ color: "var(--success)" }}>
                                    ✓ {coordLabel}
                                </p>
                            )}
                            {coordValid === null && (
                                <p className="input-hint">Decimal: 37.123, -3.456 · DMS: 37°39′30″N 3°43′04″W</p>
                            )}
                        </div>
                        {/* Mini map preview */}
                        <div style={{ flex: 1, borderRadius: 14, overflow: "hidden", minHeight: 180, position: "relative" }}>
                            <LocationPickerMap
                                lat={formData.latitude}
                                lng={formData.longitude}
                                flyTo={coordValid ? [formData.latitude, formData.longitude] : undefined}
                                interactive={false}
                            />
                            {/* Center pin */}
                            <div style={{
                                position: "absolute", top: "50%", left: "50%",
                                transform: "translate(-50%, -50%)",
                                zIndex: 900, pointerEvents: "none",
                            }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: 99,
                                    background: "var(--primary)", border: "3px solid white",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── PHOTO mode ── */}
                {locMode === "photo" && (
                    <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 16, height: "100%", overflowY: "auto" }}>
                        <div>
                            <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 12, lineHeight: 1.5 }}>
                                Sube una foto y extraeremos las coordenadas GPS de sus metadatos EXIF.
                            </p>
                            <button
                                className="btn btn-soft btn-md btn-full"
                                onClick={() => exifInputRef.current?.click()}
                            >
                                <Icon name="image" size={18} />
                                Elegir foto
                            </button>
                            <input ref={exifInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleExifPick} />
                        </div>

                        {exifStatus === "found" && (
                            <div style={{
                                background: "var(--success-soft)", color: "var(--success)",
                                borderRadius: 12, padding: "12px 14px",
                                display: "flex", alignItems: "center", gap: 10,
                            }}>
                                <Icon name="check" size={18} />
                                <div>
                                    <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>GPS encontrado</p>
                                    <p style={{ fontFamily: "var(--mono)", fontSize: 12, margin: "2px 0 0", opacity: 0.85 }}>{coordLabel}</p>
                                </div>
                            </div>
                        )}

                        {exifStatus === "notfound" && (
                            <div style={{
                                background: "var(--danger-soft)", color: "var(--danger)",
                                borderRadius: 12, padding: "12px 14px",
                                display: "flex", alignItems: "center", gap: 10,
                            }}>
                                <Icon name="info" size={18} />
                                <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>
                                    Esta foto no contiene datos GPS.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );

    const renderStep2 = () => (
        <div style={{ padding: "16px 16px 24px", overflowY: "auto", height: "100%" }}>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16, fontWeight: 600 }}>
                ¿Qué tipo de lugar es?
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                {TYPE_LIST.map(type => {
                    const active = formData.category === type.id;
                    return (
                        <button
                            key={type.id}
                            onClick={() => setFormData(p => ({ ...p, category: type.id }))}
                            style={{
                                display: "flex", alignItems: "center", gap: 12,
                                padding: "14px 14px",
                                borderRadius: 16,
                                border: `2px solid ${active ? type.color : "var(--border)"}`,
                                background: active ? `${type.color}18` : "var(--surface)",
                                cursor: "pointer",
                                transition: "border-color .15s, background .15s",
                                textAlign: "left",
                            }}
                        >
                            <div style={{
                                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                                background: active ? type.color : "var(--surface-2)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "background .15s",
                            }}>
                                <Icon name={type.icon} size={20} style={{ color: active ? "#fff" : "var(--muted)" }} />
                            </div>
                            <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: active ? type.color : "var(--text)", margin: 0 }}>
                                    {type.short}
                                </p>
                                <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 0", lineHeight: 1.3 }}>
                                    {type.label}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 18, height: "100%", overflowY: "auto" }}>
            {/* Nombre */}
            <div>
                <label className="label">Nombre del lugar</label>
                <input
                    className="input"
                    placeholder="Ej. Mirador del Lago"
                    value={formData.title}
                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                    autoFocus
                />
            </div>

            {/* Precio + plazas */}
            <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                    <label className="label">Precio</label>
                    <label style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 14px", borderRadius: 14,
                        background: formData.isFree ? "var(--success-soft)" : "var(--surface-2)",
                        cursor: "pointer", transition: "background .15s",
                    }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: formData.isFree ? "var(--success)" : "var(--text-2)" }}>
                            {formData.isFree ? "Gratuito" : "De pago"}
                        </span>
                        <div className={`switch ${formData.isFree ? "is-on" : ""}`}
                            onClick={() => setFormData(p => ({ ...p, isFree: !p.isFree }))}>
                            <span />
                        </div>
                    </label>
                </div>

                <div style={{ flex: 1 }}>
                    <label className="label">Plazas</label>
                    <div style={{
                        display: "flex", gap: 3, background: "var(--surface-2)",
                        borderRadius: 14, padding: 4,
                    }}>
                        {[1, 2, 3, 4, 5].map(n => (
                            <button
                                key={n}
                                onClick={() => setFormData(p => ({ ...p, places: n }))}
                                style={{
                                    flex: 1, height: 36, borderRadius: 10, border: "none",
                                    fontWeight: 700, fontSize: 13, cursor: "pointer",
                                    background: formData.places === n ? "var(--primary)" : "transparent",
                                    color: formData.places === n ? "var(--on-primary)" : "var(--muted)",
                                    transition: "background .15s, color .15s",
                                }}
                            >
                                {n}{n === 5 ? "+" : ""}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Valoración */}
            <div>
                <label className="label">Valoración</label>
                <div style={{ display: "flex", gap: 4 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            onClick={() => setFormData(p => ({ ...p, rating: p.rating === star ? 0 : star }))}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, lineHeight: 0 }}
                        >
                            <Icon
                                name="star"
                                size={30}
                                filled={formData.rating >= star}
                                style={{ color: formData.rating >= star ? "var(--warning)" : "var(--border-strong)" }}
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* Descripción */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingBottom: 16 }}>
                <label className="label">Descripción <span style={{ fontWeight: 400, color: "var(--faint)" }}>(opcional)</span></label>
                <textarea
                    className="input"
                    placeholder="Vista, acceso, instalaciones…"
                    value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    style={{ flex: 1, minHeight: 120, resize: "none" }}
                />
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 20, height: "100%", overflowY: "auto" }}>
            {/* Servicios */}
            <div>
                <label className="label">Servicios disponibles</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {SPOT_SERVICES.map(srv => {
                        const active = formData.services.includes(srv.label);
                        return (
                            <button
                                key={srv.label}
                                className={`svc-chip ${active ? "is-on" : ""}`}
                                onClick={() => setFormData(p => ({
                                    ...p,
                                    services: active
                                        ? p.services.filter(s => s !== srv.label)
                                        : [...p.services, srv.label],
                                }))}
                            >
                                <Icon name={srv.icon} size={15} />
                                {srv.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Fotos */}
            <div style={{ paddingBottom: 24 }}>
                <label className="label">Fotos <span style={{ fontWeight: 400, color: "var(--faint)" }}>(máx. 5)</span></label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {formData.images.map((img, idx) => (
                        <div key={idx} style={{ position: "relative", aspectRatio: "1", borderRadius: 12, overflow: "hidden", background: "var(--surface-2)" }}>
                            <img
                                src={typeof img === "string" ? img : URL.createObjectURL(img)}
                                alt=""
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            {/* Edit/crop button */}
                            <button
                                onClick={() => {
                                    const src = typeof img === "string" ? img : URL.createObjectURL(img);
                                    setImageSrc(src);
                                    setCroppingIdx(idx);
                                }}
                                style={{
                                    position: "absolute", top: 4, left: 4, width: 24, height: 24,
                                    borderRadius: 99, background: "rgba(0,0,0,0.55)",
                                    border: "none", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "white",
                                }}
                            >
                                <Icon name="brush" size={12} />
                            </button>
                            {/* Delete button */}
                            <button
                                onClick={() => setFormData(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))}
                                style={{
                                    position: "absolute", top: 4, right: 4, width: 24, height: 24,
                                    borderRadius: 99, background: "rgba(229,72,77,0.9)",
                                    border: "none", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "white",
                                }}
                            >
                                <Icon name="close" size={12} />
                            </button>
                        </div>
                    ))}

                    {formData.images.length < 5 && (
                        <div style={{
                            aspectRatio: "1", borderRadius: 12, overflow: "hidden",
                            border: "2px dashed var(--border)", display: "flex",
                            flexDirection: "column",
                        }}>
                            <button
                                onClick={() => cameraInputRef.current?.click()}
                                style={{
                                    flex: 1, display: "flex", flexDirection: "column",
                                    alignItems: "center", justifyContent: "center", gap: 2,
                                    background: "transparent", border: "none",
                                    borderBottom: "1px solid var(--border)",
                                    cursor: "pointer", color: "var(--muted)", fontSize: 11, fontWeight: 600,
                                }}
                            >
                                <Icon name="camera" size={18} />
                                Cámara
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    flex: 1, display: "flex", flexDirection: "column",
                                    alignItems: "center", justifyContent: "center", gap: 2,
                                    background: "transparent", border: "none",
                                    cursor: "pointer", color: "var(--muted)", fontSize: 11, fontWeight: 600,
                                }}
                            >
                                <Icon name="image" size={18} />
                                Galería
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <input ref={fileInputRef}   type="file" accept="image/*"                       style={{ display: "none" }} onChange={onPhotoFileChange} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={onPhotoFileChange} />
        </div>
    );

    return createPortal(
        <div style={{
            position: "fixed", inset: 0, zIndex: 10000,
            background: "var(--surface)", display: "flex", flexDirection: "column",
        }}>
            {/* Processing overlay */}
            {isProcessing && (
                <div style={{
                    position: "absolute", inset: 0, zIndex: 15000,
                    background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12,
                }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: "50%",
                        border: "3px solid var(--border)", borderTopColor: "var(--primary)",
                        animation: "spin .7s linear infinite",
                    }} />
                    <p style={{ color: "var(--on-primary)", fontWeight: 600, fontSize: 14 }}>Guardando…</p>
                </div>
            )}

            {/* Image cropper overlay */}
            {imageSrc && (
                <div style={{ position: "absolute", inset: 0, zIndex: 12000, background: "#000", display: "flex", flexDirection: "column" }}>
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 16px", color: "white", flexShrink: 0,
                    }}>
                        <button onClick={cancelCrop} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontWeight: 600 }}>Cancelar</button>
                        <span style={{ fontWeight: 700 }}>Editar foto</span>
                        <button onClick={saveCrop} style={{ background: "none", border: "none", color: "var(--success)", cursor: "pointer", fontWeight: 700 }}>Guardar</button>
                    </div>
                    <div style={{ flex: 1, position: "relative" }}>
                        <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={aspect}
                            onCropChange={setCrop} onCropComplete={(_, px) => setCroppedPixels(px)} onZoomChange={setZoom} />
                    </div>
                    <div style={{ padding: "12px 16px 24px", background: "#111", display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                            {[["4:3", 4/3], ["1:1", 1], ["3:4", 3/4], ["16:9", 16/9]].map(([label, val]) => (
                                <button key={label as string} onClick={() => setAspect(val as number)} style={{
                                    padding: "4px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                                    background: aspect === val ? "var(--primary)" : "#333",
                                    color: aspect === val ? "white" : "#aaa",
                                    fontSize: 12, fontWeight: 700,
                                }}>
                                    {label as string}
                                </button>
                            ))}
                        </div>
                        <input type="range" value={zoom} min={1} max={3} step={0.05}
                            onChange={e => setZoom(+e.target.value)}
                            style={{ accentColor: "var(--primary)" }} />
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 16px", height: 56, borderBottom: "1px solid var(--border)",
                flexShrink: 0,
            }}>
                <button
                    className="iconbtn iconbtn-ghost"
                    style={{ width: 36, height: 36 }}
                    onClick={() => step > 1 ? setStep(s => s - 1) : close()}
                >
                    <Icon name="back" size={20} />
                </button>
                <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em", color: "var(--text)" }}>
                    {isEditing ? "Editar lugar" : step === 1 ? "¿Dónde está?" : step === 2 ? "¿Qué tipo de lugar?" : step === 3 ? "Lo básico" : "Servicios y fotos"}
                </span>
                <button className="iconbtn iconbtn-ghost" style={{ width: 36, height: 36 }} onClick={close}>
                    <Icon name="close" size={18} />
                </button>
            </div>

            {/* Progress bar */}
            <div style={{ height: 3, background: "var(--surface-2)", flexShrink: 0 }}>
                <div style={{
                    height: "100%", background: "var(--primary)",
                    width: `${(step / TOTAL_STEPS) * 100}%`,
                    transition: "width .3s ease",
                }} />
            </div>

            {/* Step content */}
            <div style={{ flex: 1, overflow: "hidden" }}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
            </div>

            {/* Footer */}
            <div style={{
                padding: "12px 16px 28px", borderTop: "1px solid var(--border)",
                display: "flex", gap: 10, flexShrink: 0, background: "var(--surface)",
            }}>
                {step === 1 && !isEditing && (
                    <button className="btn btn-ghost btn-md" style={{ flex: 1 }} onClick={() => submit(true)}>
                        Guardar rápido
                    </button>
                )}
                {step > 1 && (
                    <button className="btn btn-ghost btn-md" style={{ flex: 1 }} onClick={() => setStep(s => s - 1)}>
                        Anterior
                    </button>
                )}
                <button
                    className={`btn btn-md ${step === TOTAL_STEPS ? "btn-success" : "btn-primary"}`}
                    style={{ flex: 2 }}
                    onClick={() => step === TOTAL_STEPS ? submit(false) : setStep(s => s + 1)}
                >
                    {step === TOTAL_STEPS
                        ? (isEditing ? "Guardar cambios" : "Crear lugar")
                        : "Siguiente"}
                </button>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>,
        document.body
    );
}
