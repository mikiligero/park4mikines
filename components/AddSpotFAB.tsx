"use client";

import { useState, useRef } from "react";
import { Plus, Camera, MapPin, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { getGPSFromImage } from "@/lib/exif";
import AddSpotWizard from "@/components/AddSpotWizard";

export default function AddSpotFAB({ isLoggedIn }: { isLoggedIn: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [addingFromPhoto, setAddingFromPhoto] = useState<{ file: File, lat?: number, lon?: number } | null>(null);

    const handleOptionClick = (type: "map" | "photo") => {
        if (!isLoggedIn) {
            router.push("/login");
            return;
        }

        if (type === "map") {
            router.push("/add");
        } else {
            fileInputRef.current?.click();
        }
        setIsOpen(false);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const coords = await getGPSFromImage(file);
            setAddingFromPhoto({
                file,
                lat: coords?.lat,
                lon: coords?.lon
            });
        }
        e.target.value = "";
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[1900] bg-black/20 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className="fixed bottom-6 right-6 z-[2000] flex flex-col items-end gap-3">
                {isOpen && (
                    <div className="flex flex-col items-end gap-3 mb-2 animate-in slide-in-from-bottom-5 fade-in duration-200">
                        <button
                            onClick={() => handleOptionClick("photo")}
                            className="flex items-center gap-3 bg-white text-gray-800 px-4 py-3 rounded-full shadow-lg border border-gray-100 font-medium hover:bg-gray-50 active:scale-95 transition-all text-sm"
                        >
                            <span className="whitespace-nowrap">Añadir desde foto</span>
                            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-full">
                                <Camera className="w-5 h-5" />
                            </div>
                        </button>
                        <button
                            onClick={() => handleOptionClick("map")}
                            className="flex items-center gap-3 bg-white text-gray-800 px-4 py-3 rounded-full shadow-lg border border-gray-100 font-medium hover:bg-gray-50 active:scale-95 transition-all text-sm"
                        >
                            <span className="whitespace-nowrap">Añadir</span>
                            <div className="bg-emerald-100 text-emerald-600 p-2 rounded-full">
                                <MapPin className="w-5 h-5" />
                            </div>
                        </button>
                    </div>
                )}

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 z-[2001]"
                >
                    {isOpen ? <X className="h-7 w-7" /> : <Plus className="h-8 w-8" />}
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
                    onCancel={() => {
                        setAddingFromPhoto(null);
                    }}
                />
            )}
        </>
    );
}
