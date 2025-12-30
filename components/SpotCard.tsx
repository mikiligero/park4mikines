/* eslint-disable */
"use client";

import { Star, Camera } from "lucide-react";
import FavoriteButton from "./FavoriteButton";
import { getCategoryStyles } from "@/lib/categories";
import { getServiceIconPath } from "@/lib/services";

interface SpotCardProps {
    spot: any;
    onClick: () => void;
}

export default function SpotCard({ spot, onClick }: SpotCardProps) {
    const { img: categoryIcon, label: categoryLabel } = getCategoryStyles(spot.category);

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-xl border-2 border-blue-600 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
        >
            {/* Header Image */}
            <div className="relative h-56 w-full bg-gray-200">
                <img
                    src={spot.images?.[0]?.url || "/placeholder-image.jpg"}
                    alt={spot.title}
                    className="w-full h-full object-cover rounded-t-[10px]"
                />

                {/* Favorite Button */}
                <div className="absolute top-4 right-4 z-10">
                    <div className="bg-white rounded-full p-2 shadow-sm">
                        <FavoriteButton spotId={spot.id} initialIsFavorite={spot.isFavorite} />
                    </div>
                </div>

                {/* Category Badge - Overlapping Bottom */}
                <div className="absolute -bottom-7 left-5 z-20">
                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-md border border-gray-100">
                        <img src={categoryIcon} alt={categoryLabel} className="w-8 h-8" />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="pt-10 px-5 pb-5 rounded-b-xl">
                {/* Title */}
                <div className="mb-2">
                    <h3 className="font-bold text-[#1e40af] text-xl leading-tight line-clamp-2">
                        {spot.title}
                    </h3>
                </div>

                {/* Description */}
                <p className="text-gray-700 text-[0.95rem] line-clamp-4 mb-5 leading-relaxed font-medium">
                    {spot.description || "Sin descripción."}
                </p>

                {/* Services - Removed filters and backgrounds, showing SVG as is from zero */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {spot.services?.slice(0, 6).map((s: any) => {
                        const iconPath = getServiceIconPath(s.service.name);
                        if (!iconPath) return null;

                        return (
                            <img
                                key={s.service.name}
                                src={iconPath}
                                alt={s.service.name}
                                className="w-8 h-8"
                                title={s.service.name}
                            />
                        );
                    })}
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-end gap-6 text-gray-400 font-bold text-lg mt-auto">
                    <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">{spot.images?.length || 0}</span>
                        <Camera className="w-6 h-6 fill-gray-400 text-gray-400" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">{spot.rating || 0}</span>
                        <Star className="w-6 h-6 fill-gray-400 text-gray-400" />
                    </div>
                </div>
            </div>
        </div>
    );
}
