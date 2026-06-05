"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { getGPSFromImage } from "@/lib/exif";
import AddSpotWizard from "@/components/AddSpotWizard";

export default function AddSpotFAB({ isLoggedIn }: { isLoggedIn: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [addingFromPhoto, setAddingFromPhoto] = useState<{ file: File; lat?: number; lon?: number } | null>(null);

    const handleOption = (type: "map" | "photo") => {
        if (!isLoggedIn) { router.push("/login"); return; }
        if (type === "map") {
            router.push("/add");
        } else {
            fileInputRef.current?.click();
        }
        setIsOpen(false);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            const coords = await getGPSFromImage(file);
            setAddingFromPhoto({ file, lat: coords?.lat, lon: coords?.lon });
        }
        e.target.value = "";
    };

    return (
        <>
            {/* Backdrop when speed-dial is open */}
            {isOpen && (
                <div
                    style={{
                        position: "fixed", inset: 0, zIndex: 1900,
                        background: "rgba(0,0,0,0.25)", backdropFilter: "blur(2px)",
                    }}
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div style={{
                position: "fixed", bottom: 24, right: 24, zIndex: 2000,
                display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10,
            }}>
                {/* Speed-dial actions */}
                {isOpen && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, marginBottom: 4 }}>
                        <button
                            onClick={() => handleOption("photo")}
                            style={{
                                display: "flex", alignItems: "center", gap: 10,
                                background: "var(--surface)", color: "var(--text)",
                                padding: "10px 16px 10px 12px", borderRadius: 99,
                                border: "1px solid var(--border)", boxShadow: "var(--shadow-md)",
                                cursor: "pointer", fontWeight: 700, fontSize: 14,
                                fontFamily: "var(--font)", whiteSpace: "nowrap",
                                animation: "fadeUp .15s ease",
                            }}
                        >
                            <div style={{
                                width: 32, height: 32, borderRadius: 99,
                                background: "var(--primary-soft)", color: "var(--primary-soft-text)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <Icon name="camera" size={16} />
                            </div>
                            Añadir desde foto
                        </button>

                        <button
                            onClick={() => handleOption("map")}
                            style={{
                                display: "flex", alignItems: "center", gap: 10,
                                background: "var(--surface)", color: "var(--text)",
                                padding: "10px 16px 10px 12px", borderRadius: 99,
                                border: "1px solid var(--border)", boxShadow: "var(--shadow-md)",
                                cursor: "pointer", fontWeight: 700, fontSize: 14,
                                fontFamily: "var(--font)", whiteSpace: "nowrap",
                                animation: "fadeUp .2s ease",
                            }}
                        >
                            <div style={{
                                width: 32, height: 32, borderRadius: 99,
                                background: "var(--success-soft)", color: "var(--success)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <Icon name="pin" size={16} />
                            </div>
                            Añadir lugar
                        </button>
                    </div>
                )}

                {/* FAB principal */}
                <button
                    onClick={() => setIsOpen(v => !v)}
                    style={{
                        width: 56, height: 56, borderRadius: 99,
                        background: "var(--primary)", color: "var(--on-primary)",
                        border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "var(--shadow-lg)",
                        transition: "transform .15s, background .15s",
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                    aria-label={isOpen ? "Cerrar" : "Añadir lugar"}
                >
                    <Icon name="plus" size={26} strokeWidth={2.5} />
                </button>
            </div>

            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            {addingFromPhoto && (
                <AddSpotWizard
                    initialPhoto={addingFromPhoto.file}
                    initialLat={addingFromPhoto.lat}
                    initialLon={addingFromPhoto.lon}
                    onCancel={() => setAddingFromPhoto(null)}
                />
            )}

            <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
        </>
    );
}
