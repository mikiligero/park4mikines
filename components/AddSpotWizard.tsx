"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, X, MapPin, Search, Crosshair, Star, Trash2, Camera, Crop } from "lucide-react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import { createSpot, updateSpot } from "@/lib/actions";

// Lazy load Map for Step 1
const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
    loading: () => <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">Cargando mapa...</div>,
    ssr: false
});

export default function AddSpotWizard({ spot, onCancel, initialPhoto, initialLat, initialLon }: { spot?: any; onCancel?: () => void; initialPhoto?: File; initialLat?: number; initialLon?: number }) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loadingLocation, setLoadingLocation] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [formData, setFormData] = useState({
        latitude: spot?.latitude ?? initialLat ?? 40.416775,
        longitude: spot?.longitude ?? initialLon ?? -3.70379,
        category: spot?.category ?? "NATURE",
        title: spot?.title ?? "",
        description: spot?.description ?? "",
        services: (spot?.services?.map((s: any) => s.service.name) as string[]) ?? [] as string[],
        images: (spot?.images?.map((img: any) => img.url) as (File | string)[]) ?? (initialPhoto ? [initialPhoto] : []) as (File | string)[],
        rating: spot?.rating ?? 0,
        isFree: spot?.isFree ?? true,
        places: spot?.places ?? 1,
    });

    // Cropping State
    const [croppingImageIndex, setCroppingImageIndex] = useState<number | null>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [aspectRatio, setAspectRatio] = useState(4 / 3);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const [showManualCoords, setShowManualCoords] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            if (formData.images.length >= 5) {
                alert("Máximo 5 fotos permitidas.");
                return;
            }
            const file = e.target.files[0];
            const objectUrl = URL.createObjectURL(file);
            setImageSrc(objectUrl);
            setCroppingImageIndex(formData.images.length); // New image at the end
        }
    };

    const handleCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const saveCroppedImage = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        setIsProcessing(true);
        // Small timeout to allow the spinner to render before blocking CPU
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedImageBlob) {
                const file = new File([croppedImageBlob], `photo-${Date.now()}.webp`, { type: "image/webp" });

                if (croppingImageIndex !== null && croppingImageIndex < formData.images.length) {
                    // Editing existing
                    const newImages = [...formData.images];
                    newImages[croppingImageIndex] = file;
                    setFormData(prev => ({ ...prev, images: newImages }));
                } else {
                    // Adding new
                    setFormData(prev => ({ ...prev, images: [...prev.images, file] }));
                }

                cancelCrop();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    const cancelCrop = () => {
        setImageSrc(null);
        setCroppingImageIndex(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setAspectRatio(4 / 3);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const deleteImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const editImage = (index: number) => {
        const img = formData.images[index];
        if (typeof img === 'string') {
            setImageSrc(img);
            setCroppingImageIndex(index);
        } else {
            const objectUrl = URL.createObjectURL(img);
            setImageSrc(objectUrl);
            setCroppingImageIndex(index);
        }
    };

    useEffect(() => {
        setMounted(true);
        if (spot || (initialLat !== undefined && initialLon !== undefined)) {
            setLoadingLocation(false);
            return;
        }
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }));
                    setLoadingLocation(false);
                },
                (error) => {
                    console.error("Error getting location", error);
                    setLoadingLocation(false); // Fallback to default
                },
                { timeout: 5000 }
            );
        } else {
            setLoadingLocation(false);
        }
    }, []);

    const isLastStep = step === 5; // 1: Loc, 2: Type, 3: Desc, 4: Photos, 5: Services

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
        else if (onCancel) onCancel();
        else router.back();
    };

    const handleNext = async () => {
        if (isLastStep) {
            // Submit
            setIsProcessing(true);
            try {
                const data = new FormData();
                data.append("title", formData.title || "Nuevo sitio");
                data.append("description", formData.description);
                data.append("category", formData.category);
                data.append("latitude", formData.latitude.toString());
                data.append("longitude", formData.longitude.toString());
                data.append("longitude", formData.longitude.toString());
                data.append("rating", formData.rating.toString());
                data.append("isFree", formData.isFree.toString());
                data.append("places", formData.places.toString());
                formData.services.forEach(s => data.append("services", s));

                // Keep track of existing images and new ones
                formData.images.forEach(img => {
                    if (typeof img === 'string') {
                        data.append("existingImages", img);
                    } else {
                        data.append("images", img);
                    }
                });

                if (spot) {
                    await updateSpot(spot.id, data);
                } else {
                    await createSpot(data);
                }

                if (onCancel) onCancel();
                else router.push("/");
            } catch (error) {
                console.error("Error saving spot:", error);
                alert("Error al guardar el sitio");
            } finally {
                setIsProcessing(false);
            }
        } else {
            setStep(step + 1);
        }
    };

    // --- Render Steps ---

    const renderStep1_Location = () => (
        <div className="relative h-full w-full flex flex-col">
            <div className="absolute top-16 left-0 right-0 px-4 z-[1000] text-center">
                <h2 className="text-xl font-bold text-gray-800 bg-white/90 backdrop-blur px-4 py-2 rounded-full inline-block shadow-sm">
                    ¿Dónde está este lugar?
                </h2>
            </div>

            <div className="flex-1 relative">
                <LocationPickerMap
                    initialPosition={[formData.latitude, formData.longitude]}
                    onPositionChange={(pos) => setFormData(prev => ({ ...prev, latitude: pos.lat, longitude: pos.lng }))}
                />

                {/* Center Marker Overlay */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[900] pointer-events-none">
                    <MapPin className="w-10 h-10 text-emerald-500 mb-5 drop-shadow-lg" fill="currentColor" />
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <button
                    onClick={() => {
                        setLoadingLocation(true);
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                                (position) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        latitude: position.coords.latitude,
                                        longitude: position.coords.longitude
                                    }));
                                    setLoadingLocation(false);
                                },
                                (error) => {
                                    console.error("Error getting location", error);
                                    setLoadingLocation(false);
                                    alert("No se pudo obtener la ubicación");
                                },
                                { timeout: 5000, enableHighAccuracy: true }
                            );
                        } else {
                            setLoadingLocation(false);
                            alert("Geolocalización no soportada");
                        }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg py-3 text-sm font-medium text-blue-600 shadow-sm transition-colors hover:bg-gray-50"
                >
                    <Crosshair className="w-4 h-4" /> Mi posición
                </button>
                <button
                    onClick={() => setShowManualCoords(true)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                >
                    <MapPin className="w-4 h-4" /> Coordenadas
                </button>
            </div>

            {/* Coordinate Modal */}
            {showManualCoords && (
                <div className="fixed inset-0 z-[11000] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Introduce coordenadas</h3>

                        <CoordinatesInput

                            onChange={(lat, lon) => {
                                setFormData(prev => ({ ...prev, latitude: lat, longitude: lon }));
                                setShowManualCoords(false);
                            }}
                            onCancel={() => setShowManualCoords(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );




    const renderStep2_Category = () => {
        // Shared SVGs - ideally move to a shared file, but for now inlining


        const categories = [
            { id: "NATURE", label: "En plena naturaleza", icon: "/icons/naturaleza.svg", color: "" },
            { id: "PARKING_DN", label: "Aparcamiento día y noche", icon: "/icons/parking.svg", color: "" },
            { id: "REST_AREA", label: "Área de descanso", icon: "/icons/area-descanso.svg", color: "" },
            { id: "PICNIC", label: "Zona de picnic", icon: "/icons/picnic.svg", color: "" },
            { id: "AC_FREE", label: "Área de AC gratuita", icon: "/icons/autocaravana.svg", color: "" },
            { id: "AC_PAID", label: "Área de AC de pago", icon: "/icons/ac_pago.svg", color: "" },
            { id: "OFFROAD", label: "Off-road (4x4)", icon: "/icons/4x4.svg", color: "" },
            { id: "CAMPING", label: "Camping", icon: "/icons/camping.svg", color: "" },
            { id: "SERVICE", label: "Área de servicios sin aparcamiento", icon: "/icons/area-servicios.svg", color: "" },
            { id: "PARKING_DAY", label: "Aparcamiento solo día", icon: "/icons/parking-dia.svg", color: "" },
            { id: "CANDIDATO", label: "Candidato", icon: "/icons/candidato.svg", color: "" },
        ];

        return (
            <div className="p-4 overflow-y-auto h-full bg-white dark:bg-gray-950">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Selección del tipo de lugar</h2>
                <div className="space-y-4">
                    {categories.map(cat => (
                        <label key={cat.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 flex items-center justify-center`}>
                                    <img src={cat.icon} alt={cat.label} className="w-full h-full" />
                                </div>
                                <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{cat.label}</span>
                            </div>
                            <div className="relative flex items-center">
                                <input
                                    type="radio"
                                    name="category"
                                    value={cat.id}
                                    checked={formData.category === cat.id}
                                    onChange={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                                    className="peer h-6 w-6 border-2 border-gray-300 dark:border-gray-600 rounded-full checked:border-emerald-500 checked:bg-emerald-500 appearance-none transition-all bg-white dark:bg-gray-800"
                                />
                                <div className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"></div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        );
    };

    const renderStep3_Details = () => (
        <div className="p-4 h-full bg-white dark:bg-gray-950 flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Detalles del lugar</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Título</label>
                <input
                    type="text"
                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                    placeholder="Ej. Parking del Lago"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
            </div>

            <div className="flex gap-4 mb-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Precio</label>
                    <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <input
                            type="checkbox"
                            checked={formData.isFree}
                            onChange={(e) => setFormData(prev => ({ ...prev, isFree: e.target.checked }))}
                            className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-emerald-500 focus:ring-emerald-500 bg-white dark:bg-gray-800"
                        />
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Es gratuito</span>
                    </label>
                </div>

                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Plazas</label>
                    <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, places: num }))}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.places === num
                                    ? "bg-emerald-500 text-white shadow-sm"
                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                                    }`}
                            >
                                {num}{num === 5 ? "+" : ""}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valoración</label>
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                            className={`p-1 transition-transform active:scale-95 focus:outline-none`}
                        >
                            <Star
                                className={`w-8 h-8 ${formData.rating >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción</label>
                <textarea
                    className="w-full h-48 p-4 bg-gray-100 dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 text-gray-700 dark:text-gray-200 resize-none"
                    placeholder="Descripción del lugar (vista, instalaciones...)"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                ></textarea>
            </div>
        </div>
    );

    const renderStep4_Services = () => {
        // Detailed services list matching the image
        const services = [
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

        return (
            <div className="p-4 h-full bg-white dark:bg-gray-950 overflow-y-auto">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Servicios cercanos</h2>
                <div className="space-y-4">
                    {services.map(srv => (
                        <label key={srv.id} className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xl overflow-hidden p-1">
                                    {srv.icon.startsWith('/') ? (
                                        <img src={srv.icon} alt={srv.label} className="w-full h-full object-contain" />
                                    ) : (
                                        srv.icon
                                    )}
                                </div>
                                <span className="text-gray-700 dark:text-gray-200 font-medium">{srv.label}</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={formData.services.includes(srv.label)} // Storing label for now as string array in DB
                                onChange={(e) => {
                                    if (e.target.checked) setFormData(prev => ({ ...prev, services: [...prev.services, srv.label] }));
                                    else setFormData(prev => ({ ...prev, services: prev.services.filter(s => s !== srv.label) }));
                                }}
                                className="h-6 w-6 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-emerald-500 focus:ring-emerald-500"
                            />
                        </label>
                    ))}
                </div>
            </div>
        );
    }

    const renderStep5_Photos = () => (
        <div className="p-4 h-full bg-white dark:bg-gray-950 flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Fotos del lugar</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Añade hasta 5 fotos. Clic para recortar/editar.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {formData.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 group">
                        <img
                            src={typeof img === 'string' ? img : URL.createObjectURL(img)}
                            alt={`Preview ${idx}`}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button
                                onClick={() => editImage(idx)}
                                className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm"
                            >
                                <Crop className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => deleteImage(idx)}
                                className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white backdrop-blur-sm"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}

                {formData.images.length < 5 && (
                    <div className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex flex-col overflow-hidden">
                        <button
                            onClick={() => cameraInputRef.current?.click()}
                            className="flex-1 w-full flex flex-col items-center justify-center gap-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors border-b border-gray-100 dark:border-gray-800"
                        >
                            <Camera className="w-6 h-6" />
                            <span className="text-xs font-medium">Cámara</span>
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 w-full flex flex-col items-center justify-center gap-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                            <span className="text-2xl leading-none font-light">+</span>
                            <span className="text-xs font-medium">Galería</span>
                        </button>
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={onFileChange}
            />
            <input
                type="file"
                ref={cameraInputRef}
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={onFileChange}
            />

            {/* Cropper Modal */}
            {imageSrc && (
                <div className="fixed inset-0 z-[6000] bg-black flex flex-col">
                    <div className="p-4 flex justify-between items-center text-white shrink-0">
                        <button onClick={cancelCrop}>Cancelar</button>
                        <span className="font-bold">Editar foto</span>
                        <button onClick={saveCroppedImage} className="text-emerald-400 font-bold">Guardar</button>
                    </div>

                    <div className="flex-1 relative bg-black">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspectRatio}
                            onCropChange={setCrop}
                            onCropComplete={handleCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>

                    <div className="p-4 bg-black flex flex-col gap-4">
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setAspectRatio(4 / 3)}
                                className={`px-3 py-1 rounded text-xs ${aspectRatio === 4 / 3 ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-300'}`}
                            >
                                4:3
                            </button>
                            <button
                                onClick={() => setAspectRatio(3 / 4)}
                                className={`px-3 py-1 rounded text-xs ${aspectRatio === 3 / 4 ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-300'}`}
                            >
                                3:4
                            </button>
                            <button
                                onClick={() => setAspectRatio(1)}
                                className={`px-3 py-1 rounded text-xs ${aspectRatio === 1 ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-300'}`}
                            >
                                1:1
                            </button>
                            <button
                                onClick={() => setAspectRatio(16 / 9)}
                                className={`px-3 py-1 rounded text-xs ${aspectRatio === 16 / 9 ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-300'}`}
                            >
                                16:9
                            </button>
                        </div>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                    </div>
                </div>
            )}
        </div>
    );

    if (!mounted) return null;

    if (loadingLocation) {
        return createPortal(
            <div className="fixed inset-0 bg-white z-[5000] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-gray-500 animate-pulse">Obteniendo tu ubicación...</p>
                </div>
            </div>,
            document.body
        );
    }

    return createPortal(
        <div className="fixed inset-0 bg-white z-[10000] flex flex-col h-screen w-screen">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100 bg-white shrink-0">
                <button onClick={handleBack} className="p-2 -ml-2 text-gray-600">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-semibold text-gray-700">{spot ? "Editando sitio" : "Añadiendo un lugar"}</h1>
                <button onClick={() => { if (onCancel) onCancel(); else router.push("/"); }} className="p-2 -mr-2 text-gray-600">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Loader Overlay */}
            {isProcessing && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-[15000] flex flex-col items-center justify-center animate-in fade-in duration-200">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
                        <p className="text-gray-600 font-medium">Procesando...</p>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {step === 1 && renderStep1_Location()}
                {step === 2 && renderStep2_Category()}
                {step === 3 && renderStep3_Details()}
                {step === 4 && renderStep4_Services()}
                {step === 5 && renderStep5_Photos()}
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-white border-t border-gray-100 shrink-0 flex gap-4">
                <button
                    onClick={() => { if (onCancel) onCancel(); else router.push("/"); }}
                    className="flex-1 py-3 px-6 rounded-full bg-rose-400 text-white font-semibold shadow-md active:scale-95 transition-transform"
                >
                    Salir
                </button>
                <button
                    onClick={handleNext}
                    className={`flex-1 py-3 px-6 rounded-full font-semibold shadow-md active:scale-95 transition-transform ${step === 1 ? "bg-emerald-400 text-white" : "bg-slate-500 text-white" // Map step usually has distinct specific "It's here" button, trying to match reference style
                        }`}
                    style={{ backgroundColor: step === 1 ? '#4ade80' : '#8da2c0' }} // Trying to match the purplish-grey from screenshots for Next, green for Map confirm
                >
                    {step === 1 ? "¡Es aquí!" : isLastStep ? (spot ? "Guardar cambios" : "Crear lugar") : "Siguiente"}
                </button>
            </div>
        </div>,
        document.body
    );
}

// Helper to parse coordinate string (DMS or Decimal)
function parseCoordinateString(input: string): { lat: number, lon: number } | null {
    // 1. Try DMS format first (e.g. 37°39'30.5"N 3°43'04.2"W)
    // Matches: degrees, minutes, seconds, direction (N/S/E/W)
    // We look for two groups of this pattern
    const dmsRegex = /(\d+)[°º\s]+(\d+)[`'\s]+(\d+(?:\.\d+)?)[´"\s]*([NSEW])/gi;
    const dmsMatches = [...input.matchAll(dmsRegex)];

    if (dmsMatches.length >= 2) {
        const parseDMS = (deg: string, min: string, sec: string, dir: string) => {
            let decimal = parseFloat(deg) + parseFloat(min) / 60 + parseFloat(sec) / 3600;
            if (dir.toUpperCase() === 'S' || dir.toUpperCase() === 'W') {
                decimal *= -1;
            }
            return decimal;
        };

        const lat = parseDMS(dmsMatches[0][1], dmsMatches[0][2], dmsMatches[0][3], dmsMatches[0][4]);
        const lon = parseDMS(dmsMatches[1][1], dmsMatches[1][2], dmsMatches[1][3], dmsMatches[1][4]);
        return { lat, lon };
    }

    // 2. Try Standard Decimal format
    // Regex: /(-?\s*\d+(?:\.\d+)?)/g
    const decimalMatches = input.match(/(-?\s*\d+(?:\.\d+)?)/g);
    if (decimalMatches && decimalMatches.length >= 2) {
        const lat = parseFloat(decimalMatches[0].replace(/\s/g, ''));
        const lon = parseFloat(decimalMatches[1].replace(/\s/g, ''));
        return { lat, lon };
    }

    return null;
}

// Helper component for Coordinates to manage focus/typing state
function CoordinatesInput({ onChange, onCancel }: { onChange: (lat: number, lon: number) => void, onCancel: () => void }) {
    const [value, setValue] = useState("");

    const handleApply = () => {
        const result = parseCoordinateString(value);

        if (result) {
            if (
                !isNaN(result.lat) && !isNaN(result.lon) &&
                result.lat >= -90 && result.lat <= 90 &&
                result.lon >= -180 && result.lon <= 180
            ) {
                onChange(result.lat, result.lon);
            } else {
                alert("Coordenadas fuera de rango (-90 a 90, -180 a 180)");
            }
        } else {
            alert("Formato no reconocido. Prueba:\n- Decimal: 37.123, -3.123\n- DMS: 37°39'30.5\"N 3°43'04.2\"W");
        }
    };

    return (
        <div>
            <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Ej: 37.123, -3.123&#10;o DMS: 37°39'30.5&quot;N 3°43'04.2&quot;W"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono mb-6 focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-24"
                autoFocus
            />

            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 py-3 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleApply}
                    className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-md transition-colors"
                >
                    Aceptar
                </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-6">
                Soporta formatos Decimal y DMS (Grados, Minutos, Segundos)
            </p>
        </div>
    );
}
